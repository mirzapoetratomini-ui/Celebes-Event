import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { INITIAL_USERS, INITIAL_EVENTS, INITIAL_ORDERS, INITIAL_VOUCHERS, INITIAL_PAYOUTS, DEFAULT_PLATFORM_SETTINGS, INITIAL_SUPPORT_TICKETS, INITIAL_FAQS } from './src/data/seedData';
import { EventItem, Order, User, Voucher, PayoutRequest, Ticket, PlatformSettings, SupportTicket, FaqItem } from './src/types';
import { verifyAndCheckInTicket } from './src/utils/ticketing-logic';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const LOCAL_STORAGE_FILE = path.resolve(process.cwd(), 'database', 'local_data.json');

// In-Memory resilient store (fallback when MySQL host is not configured or in local preview)
let memoryUsers: User[] = [...INITIAL_USERS];
let memoryEvents: EventItem[] = JSON.parse(JSON.stringify(INITIAL_EVENTS));
let memoryOrders: Order[] = JSON.parse(JSON.stringify(INITIAL_ORDERS));
let memoryVouchers: Voucher[] = JSON.parse(JSON.stringify(INITIAL_VOUCHERS));
let memoryPayouts: PayoutRequest[] = JSON.parse(JSON.stringify(INITIAL_PAYOUTS));
let memorySettings: PlatformSettings = JSON.parse(JSON.stringify(DEFAULT_PLATFORM_SETTINGS));
let memorySupportTickets: SupportTicket[] = JSON.parse(JSON.stringify(INITIAL_SUPPORT_TICKETS));
let memoryFaqs: FaqItem[] = JSON.parse(JSON.stringify(INITIAL_FAQS));

function saveLocalData() {
  try {
    const dir = path.dirname(LOCAL_STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dataToSave = {
      users: memoryUsers,
      events: memoryEvents,
      orders: memoryOrders,
      vouchers: memoryVouchers,
      payouts: memoryPayouts,
      settings: memorySettings,
      supportTickets: memorySupportTickets,
      faqs: memoryFaqs,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Storage] Gagal menyimpan database/local_data.json:', err);
  }
}

function loadLocalData() {
  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const content = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.users) && parsed.users.length) memoryUsers = parsed.users;
      if (Array.isArray(parsed.events)) memoryEvents = parsed.events;
      if (Array.isArray(parsed.orders)) memoryOrders = parsed.orders;
      if (Array.isArray(parsed.vouchers)) memoryVouchers = parsed.vouchers;
      if (Array.isArray(parsed.payouts)) memoryPayouts = parsed.payouts;
      if (parsed.settings) memorySettings = parsed.settings;
      if (Array.isArray(parsed.supportTickets)) memorySupportTickets = parsed.supportTickets;
      if (Array.isArray(parsed.faqs)) memoryFaqs = parsed.faqs;
      console.log('[Storage] Data lokal berhasil dimuat dari database/local_data.json');
    }
  } catch (err) {
    console.warn('[Storage] Gagal membaca database/local_data.json, menggunakan data awal:', err);
  }
}

loadLocalData();

// MySQL Connection Pool (if configured via env vars)
let mysqlPool: mysql.Pool | null = null;
let isMysqlActive = false;
let mysqlLastError = '';

async function initMysql() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  const password = process.env.MYSQL_PASSWORD;
  const port = Number(process.env.MYSQL_PORT) || 3306;

  if (host && user && database) {
    try {
      mysqlPool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 4000,
      });

      const connection = await mysqlPool.getConnection();
      await connection.ping();
      connection.release();
      isMysqlActive = true;
      mysqlLastError = '';
      console.log(`[Database] Terkoneksi ke MySQL Host: ${host}, Database: ${database}`);
    } catch (err: any) {
      isMysqlActive = false;
      mysqlLastError = err?.message || 'Gagal terhubung ke MySQL';
      console.warn(`[Database] MySQL tidak aktif atau belum siap (${mysqlLastError}). Menggunakan penyimpanan in-memory yang stabil.`);
    }
  } else {
    isMysqlActive = false;
    mysqlLastError = 'Variabel environment MYSQL_HOST belum disetel. Berjalan dalam mode Local In-Memory.';
  }
}

initMysql();

// ==========================================
// API ROUTES
// ==========================================

// 1. Database Status & Diagnostics
app.get('/api/db-status', async (_req: Request, res: Response) => {
  let latency = 0;
  if (isMysqlActive && mysqlPool) {
    try {
      const start = Date.now();
      await mysqlPool.query('SELECT 1');
      latency = Date.now() - start;
    } catch {
      isMysqlActive = false;
    }
  }

  res.json({
    isConfigured: Boolean(process.env.MYSQL_HOST),
    mode: isMysqlActive ? 'mysql' : 'local-storage',
    host: process.env.MYSQL_HOST || 'Local File Storage (database/local_data.json)',
    database: process.env.MYSQL_DATABASE || 'celebes_event_db (File Storage)',
    user: process.env.MYSQL_USER || 'root',
    connected: isMysqlActive,
    latencyMs: latency,
    tableCounts: {
      users: memoryUsers.length,
      events: memoryEvents.length,
      orders: memoryOrders.length,
      vouchers: memoryVouchers.length,
      payouts: memoryPayouts.length,
    },
    message: isMysqlActive
      ? 'Database MySQL/MariaDB aktif dan terhubung normal ke hosting.'
      : 'Berjalan dalam mode Standalone File Storage (database/local_data.json). Aplikasi aktif 100% dan data tersimpan permanen tanpa perlu MySQL.',
  });
});

// Test custom MySQL connection parameters from admin UI
app.post('/api/test-mysql', async (req: Request, res: Response) => {
  const { host, user, password, database, port } = req.body;
  try {
    const testPool = mysql.createPool({
      host: host || 'localhost',
      port: Number(port) || 3306,
      user,
      password,
      database,
      connectTimeout: 4000,
    });
    const conn = await testPool.getConnection();
    await conn.ping();
    conn.release();
    await testPool.end();
    res.json({ success: true, message: `Koneksi ke MySQL database '${database}' berhasil!` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: `Koneksi gagal: ${err.message}` });
  }
});

// 2. Export / Download MySQL Schema & Deploy Package
app.get('/api/export-sql', (_req: Request, res: Response) => {
  const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="celebes_event_mysql.sql"');
    res.send(sqlContent);
  } else {
    res.status(404).json({ error: 'File schema.sql tidak ditemukan' });
  }
});

app.get('/api/download-package', (_req: Request, res: Response) => {
  const packagePath = path.resolve(process.cwd(), 'public', 'celebes-event-production.tar.gz');
  if (fs.existsSync(packagePath)) {
    res.download(packagePath, 'celebes-event-production.tar.gz');
  } else {
    res.status(404).json({ error: 'Paket arsip celebes-event-production.tar.gz sedang dibuat' });
  }
});

// 3. Events Endpoints
app.get('/api/events', (req: Request, res: Response) => {
  const { category, search, status, creatorId } = req.query;
  let results = [...memoryEvents];

  if (category && category !== 'Semua') {
    results = results.filter(e => e.category.toLowerCase().includes(String(category).toLowerCase()));
  }
  if (status) {
    results = results.filter(e => e.status === status);
  }
  if (creatorId) {
    results = results.filter(e => e.creatorId === creatorId);
  }
  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      (e.venueName && e.venueName.toLowerCase().includes(q))
    );
  }

  res.json(results);
});

app.get('/api/events/:idOrSlug', (req: Request, res: Response) => {
  const param = req.params.idOrSlug;
  const event = memoryEvents.find(e => e.id === param || e.slug === param || e.socialShareSlug === param);
  if (!event) {
    return res.status(404).json({ error: 'Event tidak ditemukan' });
  }
  res.json(event);
});

app.post('/api/events', (req: Request, res: Response) => {
  const newEvent: EventItem = {
    ...req.body,
    id: `evt-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  memoryEvents.unshift(newEvent);
  saveLocalData();
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = memoryEvents.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Event tidak ditemukan' });
  }
  memoryEvents[index] = {
    ...memoryEvents[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveLocalData();
  res.json(memoryEvents[index]);
});

app.delete('/api/events/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  memoryEvents = memoryEvents.filter(e => e.id !== id);
  saveLocalData();
  res.json({ success: true, message: 'Event berhasil dihapus' });
});

// 4. Orders & Registrations
app.get('/api/orders', (req: Request, res: Response) => {
  const { userId, eventId } = req.query;
  let results = [...memoryOrders];
  if (userId) {
    results = results.filter(o => o.userId === userId);
  }
  if (eventId) {
    results = results.filter(o => o.eventId === eventId);
  }
  res.json(results);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const orderData = req.body;
  const newOrder: Order = {
    ...orderData,
    id: `ord-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  // Update ticket sold count in memory event
  const event = memoryEvents.find(e => e.id === newOrder.eventId);
  if (event) {
    for (const ticket of newOrder.tickets) {
      const tier = event.tickets.find(t => t.id === ticket.tierId);
      if (tier) {
        tier.soldCount = (tier.soldCount || 0) + 1;
      }
    }
  }

  memoryOrders.unshift(newOrder);
  saveLocalData();
  res.status(201).json(newOrder);
});

app.post('/api/orders/:id/pay', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = memoryOrders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order tidak ditemukan' });
  }

  order.paymentStatus = 'paid';
  order.paidAt = new Date().toISOString();
  order.paymentReference = req.body.paymentReference || `REF-PAY-${Date.now()}`;
  saveLocalData();

  res.json({ success: true, order });
});

app.post('/api/orders/:id/verify-payment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, rejectionReason, verifiedBy } = req.body;
  const order = memoryOrders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order tidak ditemukan' });
  }

  if (status === 'paid') {
    order.paymentStatus = 'paid';
    order.paidAt = new Date().toISOString();
    order.verifiedAt = new Date().toISOString();
    order.verifiedBy = verifiedBy || 'Admin Celebes Event';
    order.rejectionReason = undefined;
  } else if (status === 'payment_rejected') {
    order.paymentStatus = 'payment_rejected';
    order.rejectionReason = rejectionReason || 'Bukti transfer tidak valid atau dana belum masuk ke mutasi bank.';
    order.verifiedBy = verifiedBy || 'Admin Celebes Event';
    order.verifiedAt = new Date().toISOString();
  } else {
    return res.status(400).json({ error: 'Status verifikasi tidak valid' });
  }

  saveLocalData();
  res.json({ success: true, order, message: status === 'paid' ? 'Pembayaran berhasil disetujui & E-Ticket aktif!' : 'Pembayaran ditolak.' });
});

// 5. Ticket Check-in & Verification
app.get('/api/tickets/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  for (const order of memoryOrders) {
    const tkt = order.tickets.find(t => t.ticketCode === code || t.qrPayload.includes(code));
    if (tkt) {
      return res.json({ ticket: tkt, order });
    }
  }
  res.status(404).json({ error: 'Tiket tidak ditemukan' });
});

app.post('/api/tickets/checkin', (req: Request, res: Response) => {
  const { code, eventId } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Kode tiket tidak boleh kosong' });
  }

  let foundTicket: Ticket | null = null;
  let foundOrder: Order | null = null;

  for (const order of memoryOrders) {
    const tkt = order.tickets.find(t => t.ticketCode === code || t.qrPayload === code || t.qrPayload.includes(code));
    if (tkt) {
      foundTicket = tkt;
      foundOrder = order;
      break;
    }
  }

  if (!foundTicket || !foundOrder) {
    return res.status(404).json({ success: false, message: 'Kode tiket tidak valid atau tidak ditemukan.' });
  }

  if (eventId && foundTicket.eventId !== eventId) {
    return res.status(400).json({ success: false, message: 'Tiket ini terdaftar untuk event yang berbeda!' });
  }

  const result = verifyAndCheckInTicket(foundTicket);
  if (result.success) {
    foundTicket.checkInStatus = result.checkInStatus;
    foundTicket.checkInTime = result.checkInTime;
    saveLocalData();
  }

  res.json({
    success: result.success,
    message: result.message,
    ticket: foundTicket,
    order: foundOrder,
  });
});

// 6. Vouchers
app.post('/api/vouchers/validate', (req: Request, res: Response) => {
  const { code, eventId } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: 'Masukkan kode voucher' });
  }

  const voucher = memoryVouchers.find(v => v.code.toUpperCase() === code.trim().toUpperCase() && v.isActive);
  if (!voucher) {
    return res.status(404).json({ valid: false, message: 'Kode voucher tidak ditemukan atau sudah tidak aktif.' });
  }

  if (voucher.eventId && eventId && voucher.eventId !== eventId) {
    return res.status(400).json({ valid: false, message: 'Voucher ini tidak berlaku untuk event ini.' });
  }

  if (voucher.usedCount >= voucher.quota) {
    return res.status(400).json({ valid: false, message: 'Kuota penggunaan voucher ini sudah habis.' });
  }

  res.json({ valid: true, voucher });
});

// 7. Payout Requests
app.get('/api/payouts', (req: Request, res: Response) => {
  const { creatorId } = req.query;
  let results = [...memoryPayouts];
  if (creatorId) {
    results = results.filter(p => p.creatorId === creatorId);
  }
  res.json(results);
});

app.post('/api/payouts', (req: Request, res: Response) => {
  const newPayout: PayoutRequest = {
    ...req.body,
    id: `pay-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  memoryPayouts.unshift(newPayout);
  saveLocalData();
  res.status(201).json(newPayout);
});

app.put('/api/payouts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;
  const payout = memoryPayouts.find(p => p.id === id);
  if (!payout) {
    return res.status(404).json({ error: 'Permintaan pencairan tidak ditemukan' });
  }
  payout.status = status;
  payout.adminNote = adminNote || payout.adminNote;
  payout.processedAt = new Date().toISOString();
  saveLocalData();
  res.json(payout);
});

// 8. Users Management
app.get('/api/users', (_req: Request, res: Response) => {
  res.json(memoryUsers);
});

// 9. Platform Settings & Branding
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(memorySettings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  memorySettings = {
    ...memorySettings,
    ...req.body,
    socialLinks: {
      ...memorySettings.socialLinks,
      ...(req.body.socialLinks || {}),
    },
    qrisConfig: {
      ...memorySettings.qrisConfig,
      ...(req.body.qrisConfig || {}),
    },
  };
  saveLocalData();
  res.json({ success: true, settings: memorySettings, message: 'Pengaturan platform berhasil disimpan.' });
});

// 10. Pusat Bantuan & Layanan Penyampaian Kendala (Support Tickets)
app.get('/api/support-tickets', (req: Request, res: Response) => {
  const { status, email } = req.query;
  let results = [...memorySupportTickets];
  if (status) {
    results = results.filter(t => t.status === status);
  }
  if (email) {
    results = results.filter(t => t.email.toLowerCase() === String(email).toLowerCase());
  }
  res.json(results);
});

app.post('/api/support-tickets', (req: Request, res: Response) => {
  const { name, email, phone, category, priority, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Nama, email, subjek, dan pesan wajib diisi.' });
  }

  const newTicket: SupportTicket = {
    id: `supp-${Date.now()}`,
    ticketNumber: `HELP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
    name,
    email,
    phone: phone || '',
    category: category || 'lainnya',
    priority: priority || 'sedang',
    subject,
    message,
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  memorySupportTickets.unshift(newTicket);
  saveLocalData();
  res.status(201).json({ success: true, ticket: newTicket, message: 'Tiket bantuan berhasil dikirim! Tim kami akan segera menindaklanjuti.' });
});

app.put('/api/support-tickets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminReply } = req.body;
  const ticket = memorySupportTickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: 'Tiket bantuan tidak ditemukan.' });
  }

  if (status) ticket.status = status;
  if (adminReply !== undefined) ticket.adminReply = adminReply;
  ticket.updatedAt = new Date().toISOString();
  saveLocalData();

  res.json({ success: true, ticket, message: 'Tiket bantuan berhasil diperbarui.' });
});

// 11. FAQ Items
app.get('/api/faqs', (_req: Request, res: Response) => {
  res.json(memoryFaqs);
});

app.post('/api/faqs', (req: Request, res: Response) => {
  const newFaq: FaqItem = {
    id: `faq-${Date.now()}`,
    ...req.body,
  };
  memoryFaqs.push(newFaq);
  saveLocalData();
  res.status(201).json(newFaq);
});

// ==========================================
// STATIC FILES & VITE MIDDLEWARES
// ==========================================

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Celebes Event berjalan di port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer();
