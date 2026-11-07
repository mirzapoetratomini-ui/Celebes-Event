// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

// src/data/seedData.ts
var INITIAL_USERS = [
  {
    id: "usr-admin-01",
    email: "admin@celebes-event.com",
    name: "Super Administrator Celebes Event",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    phone: "081241129988",
    organization: "Celebes Event Platform HQ",
    auth_provider: "local",
    status: "active",
    bankName: "BCA",
    bankAccountNumber: "8880192831",
    bankAccountName: "PT CELEBES EVENT NUSANTARA",
    createdAt: "2026-01-15T08:00:00Z"
  },
  {
    id: "usr-creator-01",
    email: "kreator@celebescreative.id",
    name: "Celebes Creative Promosindo",
    role: "creator",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    phone: "081398765432",
    organization: "Celebes Creative Promosindo",
    auth_provider: "google",
    status: "active",
    bankName: "Bank Mandiri",
    bankAccountNumber: "1370019283746",
    bankAccountName: "Celebes Creative Promosindo",
    createdAt: "2026-02-10T11:30:00Z"
  },
  {
    id: "usr-user-01",
    email: "budi.santoso@gmail.com",
    name: "Budi Santoso",
    role: "user",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    phone: "085712345678",
    organization: "Universitas Indonesia",
    auth_provider: "google",
    status: "active",
    createdAt: "2026-03-01T14:20:00Z"
  }
];
var INITIAL_EVENTS = [
  {
    id: "evt-001",
    creatorId: "usr-creator-01",
    creatorName: "Celebes Creative Promosindo",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    title: "Celebes Tech Summit & AI Expo 2026",
    slug: "celebes-tech-summit-2026",
    category: "Teknologi & Bisnis",
    bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Konferensi teknologi & AI terbesar di Sulawesi menghadirkan inovator digital, Cloud, dan Startup Unicorn.",
    description: "Celebes Tech Summit & AI Expo 2026 adalah pertemuan tahunan para pemimpin teknologi, developer, founder startup, dan investor terkemuka di Sulawesi & Indonesia Timur. Dapatkan wawasan langsung mengenai Machine Learning terkini, digitalisasi maritim, otomatisasi cloud, serta peluang investasi inovasi di kawasan Celebes.",
    startDate: "2026-11-20T09:00:00",
    endDate: "2026-11-21T17:00:00",
    locationType: "venue",
    venueName: "Phinisi Grand Ballroom, Claro Makassar",
    venueAddress: "Jl. A. P. Pettarani No. 03, Mannuruki, Tamalate, Kota Makassar, Sulawesi Selatan",
    status: "published",
    isFeatured: true,
    registrationLimit: 1500,
    socialShareSlug: "celebetech26",
    tickets: [
      {
        id: "tier-001",
        eventId: "evt-001",
        name: "Early Bird - Regular Access",
        description: "Akses penuh 2 hari ke seluruh stage utama, expo hall inovasi AI, & e-sertifikat resmi.",
        price: 15e4,
        quota: 300,
        soldCount: 142,
        maxPerOrder: 4,
        isActive: true
      },
      {
        id: "tier-002",
        eventId: "evt-001",
        name: "VIP Executive Pass",
        description: "Akses VIP front-row, lunch buffet bersama para keynote speakers, VIP networking lounge, & hoodie eksklusif.",
        price: 45e4,
        quota: 100,
        soldCount: 48,
        maxPerOrder: 2,
        isActive: true
      }
    ],
    customFields: [
      {
        id: "cf-001",
        eventId: "evt-001",
        label: "Instansi / Perusahaan / Kampus",
        fieldType: "text",
        placeholder: "Contoh: PT Celebes Digital / Univ Hasanuddin",
        isRequired: true,
        orderIndex: 1
      },
      {
        id: "cf-002",
        eventId: "evt-001",
        label: "Ukuran Kaos Official Event",
        fieldType: "dropdown",
        placeholder: "Pilih Ukuran Kaos",
        options: ["S", "M", "L", "XL", "XXL"],
        isRequired: true,
        orderIndex: 2
      },
      {
        id: "cf-003",
        eventId: "evt-001",
        label: "Kebutuhan Khusus / Makanan (Dietary)",
        fieldType: "dropdown",
        placeholder: "Pilih Preferensi Konsumsi",
        options: ["Halal / Standar", "Vegetarian", "Bebas Seafood", "Tidak Ada"],
        isRequired: false,
        orderIndex: 3
      }
    ],
    createdAt: "2026-09-01T10:00:00Z"
  },
  {
    id: "evt-002",
    creatorId: "usr-creator-01",
    creatorName: "Celebes Creative Promosindo",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    title: "Celebes Sunset Music Festival Vol. 4",
    slug: "celebes-sunset-music-festival",
    category: "Musik & Hiburan",
    bannerImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Malam magis pertunjukan musik senja di tepi Pantai Losari bersama deretan musisi nasional & musisi lokal Sulawesi.",
    description: "Pentas musik outdoor megah di tepi Pantai Losari Makassar. Menampilkan musisi lokal Sulawesi & nasional papan atas, instalasi seni cahaya budaya Bugis-Makassar, serta puluhan tenant kuliner khas Celebes (Coto, Pisang Epe, Pallubasa).",
    startDate: "2026-12-05T15:00:00",
    endDate: "2026-12-05T23:00:00",
    locationType: "venue",
    venueName: "Pelataran Bugis-Makassar, Anjungan Pantai Losari",
    venueAddress: "Jl. Penghibur, Losari, Ujung Pandang, Kota Makassar, Sulawesi Selatan",
    status: "published",
    isFeatured: true,
    registrationLimit: 2e3,
    socialShareSlug: "celebesmusic26",
    tickets: [
      {
        id: "tier-003",
        eventId: "evt-002",
        name: "Presale 1 - Festival A (Front Stage)",
        description: "Akses area depan panggung utama, free welcoming softdrink, dan gelang festival glow-in-the-dark.",
        price: 12e4,
        quota: 500,
        soldCount: 310,
        maxPerOrder: 5,
        isActive: true
      },
      {
        id: "tier-004",
        eventId: "evt-002",
        name: "General Admission (GA)",
        description: "Akses reguler area festival, area kuliner Celebes, dan panggung pertunjukan spektakuler.",
        price: 85e3,
        quota: 1e3,
        soldCount: 420,
        maxPerOrder: 5,
        isActive: true
      }
    ],
    customFields: [
      {
        id: "cf-004",
        eventId: "evt-002",
        label: "Komunitas / Asal Kota",
        fieldType: "text",
        placeholder: "Contoh: Makassar Music Enthusiast / Manado Indie Club",
        isRequired: false,
        orderIndex: 1
      },
      {
        id: "cf-006",
        eventId: "evt-002",
        label: "No. Kontak Darurat (Emergency Contact)",
        fieldType: "phone",
        placeholder: "08xxxxxxxxxx",
        isRequired: true,
        orderIndex: 2
      }
    ],
    createdAt: "2026-09-15T12:00:00Z"
  },
  {
    id: "evt-003",
    creatorId: "usr-creator-01",
    creatorName: "Celebes Creative Promosindo",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    title: "Celebes Digital Marketing & Growth Masterclass 2026",
    slug: "celebes-digital-marketing-masterclass",
    category: "Workshop & Edukasi",
    bannerImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Pelatihan intensif optimasi conversion rate, funnel iklan Meta & TikTok, serta CRM untuk pebisnis & UMKM Sulawesi.",
    description: "Workshop webinar interaktif live selama 4 jam penuh studi kasus nyata. Peserta akan dibimbing membuat strategi funneling, copywriting berkonversi tinggi, pengoptimalan budget iklan berbayar, dan tracking analitik.",
    startDate: "2026-11-28T13:00:00",
    endDate: "2026-11-28T17:30:00",
    locationType: "online",
    venueName: "Zoom Webinar VIP Room",
    onlineMeetingUrl: "https://zoom.us/j/9876543210",
    status: "published",
    isFeatured: false,
    registrationLimit: 500,
    socialShareSlug: "celebesgrowth26",
    tickets: [
      {
        id: "tier-005",
        eventId: "evt-003",
        name: "Peserta Online Live + E-Sertifikat",
        description: "Akses live webinar interaktif, sesi tanya jawab langsung, rekaman video seumur hidup, dan template materi PDF.",
        price: 75e3,
        quota: 300,
        soldCount: 89,
        maxPerOrder: 10,
        isActive: true
      },
      {
        id: "tier-006",
        eventId: "evt-003",
        name: "VIP 1-on-1 Mentoring Session",
        description: "Termasuk tiket online webinar plus 1 jam konsultasi private strategi digital marketing bersama pakar.",
        price: 25e4,
        quota: 20,
        soldCount: 14,
        maxPerOrder: 1,
        isActive: true
      }
    ],
    customFields: [
      {
        id: "cf-005",
        eventId: "evt-003",
        label: "Tautan Profil LinkedIn / Website Usaha",
        fieldType: "text",
        placeholder: "https://linkedin.com/in/username atau https://tokoku.com",
        isRequired: false,
        orderIndex: 1
      },
      {
        id: "cf-007",
        eventId: "evt-003",
        label: "Tantangan Utama Bisnis Anda Saat Ini",
        fieldType: "textarea",
        placeholder: "Jelaskan kendala marketing atau target omzet yang ingin dicapai...",
        isRequired: true,
        orderIndex: 2
      }
    ],
    createdAt: "2026-10-01T09:00:00Z"
  }
];
var INITIAL_VOUCHERS = [
  {
    id: "vch-001",
    code: "CELEBESKEREN",
    discountType: "percentage",
    discountValue: 15,
    quota: 100,
    usedCount: 24,
    isActive: true,
    validUntil: "2026-12-31T23:59:59Z"
  },
  {
    id: "vch-002",
    eventId: "evt-001",
    code: "CELEBESTECH",
    discountType: "fixed",
    discountValue: 5e4,
    quota: 50,
    usedCount: 18,
    isActive: true,
    validUntil: "2026-11-20T00:00:00Z"
  },
  {
    id: "vch-003",
    eventId: "evt-002",
    code: "SENJACELEBES",
    discountType: "percentage",
    discountValue: 20,
    quota: 80,
    usedCount: 12,
    isActive: true,
    validUntil: "2026-12-05T00:00:00Z"
  }
];
var INITIAL_ORDERS = [
  {
    id: "ord-sample-01",
    orderNumber: "CE-202611-0001",
    userId: "usr-user-01",
    eventId: "evt-001",
    eventTitle: "Celebes Tech Summit & AI Expo 2026",
    buyerName: "Budi Santoso",
    buyerEmail: "budi.santoso@gmail.com",
    buyerPhone: "085712345678",
    subtotal: 15e4,
    discountAmount: 0,
    platformFee: 4500,
    totalAmount: 154500,
    paymentMethod: "qris",
    paymentChannel: "QRIS-Celebes Instant",
    paymentStatus: "paid",
    paymentReference: "REF-QRIS-992182",
    createdAt: "2026-11-01T10:15:00Z",
    paidAt: "2026-11-01T10:18:22Z",
    tickets: [
      {
        id: "tkt-sample-01",
        orderId: "ord-sample-01",
        eventId: "evt-001",
        eventTitle: "Celebes Tech Summit & AI Expo 2026",
        tierId: "tier-001",
        tierName: "Early Bird - Regular Access",
        ticketCode: "CE-TECH-8821-A9F0",
        qrPayload: "CELEBES:VERIFY:CE-TECH-8821-A9F0:evt-001:budi.santoso@gmail.com",
        attendeeName: "Budi Santoso",
        attendeeEmail: "budi.santoso@gmail.com",
        checkInStatus: "not_checked_in",
        createdAt: "2026-11-01T10:18:22Z",
        responses: [
          {
            id: "resp-001",
            ticketId: "tkt-sample-01",
            fieldId: "cf-001",
            fieldLabel: "Instansi / Perusahaan / Kampus",
            responseValue: "Universitas Hasanuddin Makassar"
          },
          {
            id: "resp-002",
            ticketId: "tkt-sample-01",
            fieldId: "cf-002",
            fieldLabel: "Ukuran Kaos Official Event",
            responseValue: "L"
          }
        ]
      }
    ]
  },
  {
    id: "ord-sample-02",
    orderNumber: "CE-202611-0002",
    userId: "usr-user-01",
    eventId: "evt-002",
    eventTitle: "Celebes Sunset Music Festival Vol. 4",
    buyerName: "Budi Santoso",
    buyerEmail: "budi.santoso@gmail.com",
    buyerPhone: "085712345678",
    subtotal: 85e3,
    discountAmount: 17e3,
    platformFee: 4500,
    totalAmount: 72500,
    paymentMethod: "virtual_account",
    paymentChannel: "BCA Virtual Account",
    paymentStatus: "paid",
    paymentReference: "VA-BCA-882910293847",
    createdAt: "2026-11-03T16:20:00Z",
    paidAt: "2026-11-03T16:25:10Z",
    tickets: [
      {
        id: "tkt-sample-02",
        orderId: "ord-sample-02",
        eventId: "evt-002",
        eventTitle: "Celebes Sunset Music Festival Vol. 4",
        tierId: "tier-004",
        tierName: "General Admission (GA)",
        ticketCode: "CE-SENJA-3310-7B4D",
        qrPayload: "CELEBES:VERIFY:CE-SENJA-3310-7B4D:evt-002:budi.santoso@gmail.com",
        attendeeName: "Budi Santoso",
        attendeeEmail: "budi.santoso@gmail.com",
        checkInStatus: "checked_in",
        checkInTime: "2026-11-04T18:30:00Z",
        createdAt: "2026-11-03T16:25:10Z",
        responses: [
          {
            id: "resp-003",
            ticketId: "tkt-sample-02",
            fieldId: "cf-004",
            fieldLabel: "Komunitas / Asal Kota",
            responseValue: "Makassar Music Enthusiast"
          }
        ]
      }
    ]
  },
  {
    id: "ord-sample-03",
    orderNumber: "CE-202611-0003",
    userId: "usr-user-01",
    eventId: "evt-001",
    eventTitle: "Celebes Tech Summit & AI Expo 2026",
    buyerName: "Rian Pratama",
    buyerEmail: "rian.pratama@gmail.com",
    buyerPhone: "081298765432",
    subtotal: 35e4,
    discountAmount: 0,
    platformFee: 4500,
    totalAmount: 354500,
    paymentType: "manual",
    paymentMethod: "bank_transfer_manual",
    paymentChannel: "Transfer Manual Bank BCA",
    paymentStatus: "pending_manual_verification",
    paymentReference: "TRF-MANUAL-20261105-01",
    paymentProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    senderBank: "Bank BCA",
    senderAccountName: "Rian Pratama",
    transferNotes: "Transfer via BCA Mobile ref #9928192 lunas",
    createdAt: "2026-11-05T07:30:00Z",
    tickets: [
      {
        id: "tkt-sample-03",
        orderId: "ord-sample-03",
        eventId: "evt-001",
        eventTitle: "Celebes Tech Summit & AI Expo 2026",
        tierId: "tier-002",
        tierName: "VIP Executive Pass",
        ticketCode: "CE-TECH-9912-V88A",
        qrPayload: "CELEBES:VERIFY:CE-TECH-9912-V88A:evt-001:rian.pratama@gmail.com",
        attendeeName: "Rian Pratama",
        attendeeEmail: "rian.pratama@gmail.com",
        checkInStatus: "not_checked_in",
        createdAt: "2026-11-05T07:30:00Z",
        responses: [
          {
            id: "resp-004",
            ticketId: "tkt-sample-03",
            fieldId: "cf-001",
            fieldLabel: "Instansi / Perusahaan / Kampus",
            responseValue: "Celebes AI Tech Hub"
          },
          {
            id: "resp-005",
            ticketId: "tkt-sample-03",
            fieldId: "cf-002",
            fieldLabel: "Ukuran Kaos Official Event",
            responseValue: "XL"
          }
        ]
      }
    ]
  }
];
var INITIAL_PAYOUTS = [
  {
    id: "pay-001",
    creatorId: "usr-creator-01",
    creatorName: "Celebes Creative Promosindo",
    eventId: "evt-002",
    eventTitle: "Celebes Sunset Music Festival Vol. 4",
    grossAmount: 15306122,
    platformFeeDeduction: 306122,
    feeBreakdownText: "Potongan platform 2% (-Rp306.122)",
    netAmount: 15e6,
    amount: 15e6,
    bankName: "Bank Mandiri",
    accountNumber: "1370019283746",
    accountName: "Celebes Creative Promosindo",
    status: "pending",
    createdAt: "2026-11-04T09:00:00Z"
  }
];
var DEFAULT_PLATFORM_SETTINGS = {
  platformName: "Celebes Event",
  tagline: "Platform Manajemen Event & E-Ticket #1 di Sulawesi",
  description: "Temukan ribuan event seru, konser musik pesisir pantai, workshop, konferensi teknologi, dan festival budaya di seluruh Sulawesi. Beli tiket instan dengan QRIS & Virtual Account atau selenggarakan event Anda sendiri dengan form kustom.",
  logoUrl: "",
  primaryColor: "#2563eb",
  contactEmail: "support@celebes-event.com",
  contactPhone: "+62 812-4112-9988",
  contactAddress: "Celebes Creative Tower Lt. 5, Jl. Somba Opu No. 88, Losari, Makassar, Sulawesi Selatan 90111",
  socialLinks: {
    instagram: "https://instagram.com/celebesevent.id",
    whatsapp: "https://wa.me/6281241129988",
    tiktok: "https://tiktok.com/@celebesevent",
    youtube: "https://youtube.com/@celebesevent",
    facebook: "https://facebook.com/celebesevent.official",
    twitter: "https://x.com/celebesevent",
    linkedin: "https://linkedin.com/company/celebesevent"
  },
  heroHeadline: "Jelajahi Pengalaman & Festival Terbaik di Celebes!",
  heroSubheadline: "Beli tiket konser musik pesisir, seminar, festival budaya Sulawesi & workshop favoritmu dengan verifikasi QR Code instan, aman dan bebas repot.",
  heroBannerImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
  announcementText: "\u{1F525} Promo Spesial Celebes: Gunakan kode voucher CELEBESKEREN untuk diskon 15% semua tiket event!",
  qrisConfig: {
    provider: "midtrans",
    merchantId: "M-CELEBES-882190",
    clientKey: "SB-Mid-client-90A8B7C6D5E4",
    serverKey: "SB-Mid-server-11X22Y33Z44W",
    isSandbox: true,
    isEnabled: true,
    webhookUrl: "https://celebes-event.com/api/webhooks/qris"
  },
  feeConfig: {
    feeType: "percentage",
    percentageValue: 2,
    fixedValue: 2e3,
    description: "Biaya platform 2% per tiket terjual untuk operasional server & payment gateway"
  },
  howToSteps: [
    {
      stepNumber: 1,
      title: "Cari Event",
      description: "Jelajahi berbagai event menarik di halaman beranda atau gunakan fitur pencarian cerdas."
    },
    {
      stepNumber: 2,
      title: "Isi Data Diri",
      description: "Pilih tiket dan lengkapi formulir pendaftaran dengan data yang valid dan lengkap."
    },
    {
      stepNumber: 3,
      title: "Pembayaran",
      description: "Selesaikan pembayaran melalui berbagai metode aman yang tersedia \u2014 transfer, e-wallet, kartu."
    },
    {
      stepNumber: 4,
      title: "Terima E-Ticket",
      description: "E-Ticket & QR Code terkirim otomatis ke email dan tersedia di dashboard akun Anda."
    }
  ],
  aboutUs: {
    title: "Tentang Kami",
    subtitle: "Platform Manajemen Event & E-Ticket Terpercaya di Sulawesi",
    story: "Celebes Event dibangun untuk memajukan industri kreatif, seni pertunjukan musik, pariwisata bahari, festival budaya lokal, dan konferensi bisnis di tanah Sulawesi serta Indonesia Timur. Kami menghadirkan integrasi pembayaran resmi (QRIS & Virtual Account), proteksi tiket digital anti-pemalsuan dengan QR kriptografis, dan solusi gerbang check-in kamera smartphone yang cepat tanpa antrean panjang.",
    vision: "Menjadi ekosistem ticketing dan promosi event digital nomor satu di Sulawesi yang terpercaya, transparan, dan inklusif bagi seluruh penyelenggara.",
    mission: "Menghadirkan teknologi tiket yang mudah diakses siapa saja, melindungi penikmat event dari calo tiket palsu, dan membantu kreator mengembangkan penjualan tiket dengan pencairan dana yang terjamin.",
    highlights: [
      { label: "Event Terselenggara", value: "1,200+" },
      { label: "Tiket Terdistribusi", value: "450,000+" },
      { label: "Mitra Kreator & Promotor", value: "350+" },
      { label: "Kepuasan Pengguna", value: "99.8%" }
    ]
  },
  servicePackages: [
    {
      id: "pkg-1",
      packageNumber: 1,
      name: "Platform Only",
      tagline: "Hanya platform, tanpa alat dan tim registrasi dari Celebes Event.",
      priceDisplay: "Rp500.000",
      unitDisplay: "/event",
      conditionNote: "Khusus event tidak berbayar. Tidak menggunakan payment gateway atau pembayaran di platform.",
      featuresIncluded: [
        "Akses semua fitur platform, termasuk dashboard",
        "Akses role Event Creator, buat event sendiri",
        "Pelatihan dan pendampingan tim gratis sebelum acara"
      ],
      featuresPreparedByOrganizer: [
        "Tim registrasi sendiri",
        "Alat scan sendiri: HP, tablet, atau laptop",
        "Upload nama, banner, dan deskripsi acara"
      ],
      isPopular: false
    },
    {
      id: "pkg-2",
      packageNumber: 2,
      name: "Event Berbayar",
      tagline: "Untuk event yang menggunakan payment gateway atau pembayaran di platform.",
      priceDisplay: "2%",
      unitDisplay: "/tiket",
      conditionNote: "Berlaku untuk Platform Only maupun On Site Registration.",
      featuresIncluded: [
        "Tidak perlu membayar Rp500.000",
        "Cukup biaya platform 2% per tiket terjual",
        "Payment gateway, kategori tiket, dan promo",
        "Verifikasi QRIS instan & transfer manual bukti struk",
        "Laporan penjualan real-time & penarikan dana transparan"
      ],
      featuresPreparedByOrganizer: [
        "Upload materi banner dan deskripsi acara",
        "Tim registrasi gate onsite"
      ],
      isPopular: true
    },
    {
      id: "pkg-3",
      packageNumber: 3,
      name: "On Site Registration",
      tagline: "Celebes Event membawa tim dan alat langsung ke venue acara.",
      priceDisplay: "Rp2.000.000",
      unitDisplay: "/event",
      conditionNote: "Khusus wilayah Makassar, Manado, Palu, Kendari, Gorontalo & kota mitra Sulawesi.",
      featuresIncluded: [
        "3 usher dan 1 teknisi berpengalaman",
        "Peralatan registrasi lengkap (HP Scanner & Barcode Printer)",
        "Check-in QR dan validasi manual di venue",
        "Pendampingan teknis hari-H hingga acara selesai"
      ],
      featuresPreparedByOrganizer: [
        "Meja registrasi dan jalur antrean",
        "Koneksi internet dan colokan listrik venue"
      ],
      isPopular: false
    }
  ],
  gallery: [
    {
      id: "gal-1",
      title: "Celebes Tech Summit & AI Expo",
      category: "Konferensi Teknologi",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
      date: "November 2026"
    },
    {
      id: "gal-2",
      title: "Celebes Sunset Music Festival Vol. 4",
      category: "Konser Musik",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      date: "November 2026"
    },
    {
      id: "gal-3",
      title: "Pameran Seni Kontemporer & Budaya Sulawesi",
      category: "Expo & Pameran",
      imageUrl: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80",
      date: "Oktober 2026"
    },
    {
      id: "gal-4",
      title: "Celebes Digital Marketing & Growth Masterclass",
      category: "Workshop Edukasi",
      imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
      date: "Oktober 2026"
    },
    {
      id: "gal-5",
      title: "Makassar Losari Coastal Fun Run 10K",
      category: "Olahraga & Komunitas",
      imageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80",
      date: "September 2026"
    },
    {
      id: "gal-6",
      title: "Festival Kuliner Khas Celebes & Kopi Toraja",
      category: "Festival Kuliner",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      date: "Agustus 2026"
    }
  ]
};
var INITIAL_SUPPORT_TICKETS = [
  {
    id: "tkt-supp-001",
    ticketNumber: "HELP-202611-001",
    name: "Andi Wijaya",
    email: "andi.wijaya@gmail.com",
    phone: "081241129988",
    category: "pembayaran",
    priority: "tinggi",
    subject: "Konfirmasi Transfer Manual Belum Berubah Status",
    message: "Halo admin, saya sudah transfer untuk pesanan CE-202611-0003 sebesar Rp354.500 lewat BCA Mobile sekitar 1 jam yang lalu, mohon dicek ya apakah bukti transfernya sudah terbaca. Terima kasih.",
    status: "in_progress",
    adminReply: "Halo Kak Andi, terima kasih atas laporannya. Tim verifikasi Celebes Event sedang mengecek mutasi bank BCA secara berkala, e-tiket akan otomatis aktif dalam hitungan menit.",
    createdAt: "2026-11-05T08:15:00Z",
    updatedAt: "2026-11-05T08:30:00Z"
  },
  {
    id: "tkt-supp-002",
    ticketNumber: "HELP-202611-002",
    name: "Siti Rahmawati",
    email: "siti.rahma@perusahaan.co.id",
    phone: "085711223344",
    category: "tiket",
    priority: "sedang",
    subject: "Request Perubahan Nama Peserta di E-Ticket",
    message: "Mohon bantuannya untuk mengoreksi nama delegasi seminar di tiket nomor CE-TECH-8821-A9F0 karena ada kesalahan ejaan gelar.",
    status: "open",
    createdAt: "2026-11-05T11:00:00Z"
  },
  {
    id: "tkt-supp-003",
    ticketNumber: "HELP-202611-003",
    name: "Hendra Gunawan",
    email: "hendra.g@gmail.com",
    phone: "081399881122",
    category: "event",
    priority: "rendah",
    subject: "Pertanyaan Terkait Lokasi Parkir Konser Sunset Musik",
    message: "Apakah panitia menyediakan shuttle bus ke Pelataran Anjungan Pantai Losari?",
    status: "resolved",
    adminReply: "Halo Kak Hendra, panitia Celebes Event menyediakan shuttle bus gratis dari area parkir CPI (Center Point of Indonesia) setiap 15 menit mulai pukul 15.00 WITA.",
    createdAt: "2026-11-04T14:20:00Z",
    updatedAt: "2026-11-04T16:00:00Z"
  }
];
var INITIAL_FAQS = [
  {
    id: "faq-01",
    category: "Pemesanan",
    question: "Bagaimana cara membeli tiket event di Celebes Event?",
    answer: "Pilih event yang ingin Anda ikuti di halaman beranda, tentukan kategori tiket dan jumlahnya, lengkapi formulir pendaftaran, lalu pilih metode pembayaran (QRIS otomatis, Virtual Account, atau transfer manual). Setelah pembayaran terverifikasi, E-Ticket langsung terbit dan dapat diunduh dalam bentuk file PDF ber-QR Code."
  },
  {
    id: "faq-02",
    category: "E-Ticket",
    question: "Berapa lama E-Ticket dan QR Code dikirimkan setelah pembayaran?",
    answer: "Untuk pembayaran otomatis (QRIS dan Virtual Account), E-Ticket terbit instan dalam waktu kurang dari 3 detik. Untuk transfer manual, setelah Anda mengunggah bukti struk transfer, admin akan memverifikasi dan tiket akan aktif maksimal 15-30 menit."
  },
  {
    id: "faq-03",
    category: "Refund & Kebijakan",
    question: "Apakah ada kebijakan refund atau pengembalian dana?",
    answer: "Kebijakan pengembalian dana bergantung pada syarat dan ketentuan masing-masing penyelenggara acara. Apabila event dibatalkan secara resmi oleh penyelenggara, dana tiket Anda akan dikembalikan 100% melalui rekening atau e-wallet asal."
  },
  {
    id: "faq-04",
    category: "Kreator Event",
    question: "Bagaimana cara membuat dan mengelola event saya sendiri?",
    answer: 'Masuk atau daftar sebagai Kreator Event, buka menu Creator Studio, lalu klik "Buat Event Baru". Anda dapat mengatur deskripsi, harga tiket berganda, kuota, form registrasi dinamis, hingga tautan promosi sosial media.'
  },
  {
    id: "faq-05",
    category: "Keamanan",
    question: "Apakah metode pembayaran di Celebes Event aman?",
    answer: "Sangat aman. Seluruh transaksi diproteksi enkripsi 256-Bit SSL berstandar Bank Indonesia dan QRIS Nasional. Pembayaran terhubung langsung dengan gateway perbankan resmi tanpa menyimpan data sensitif kartu Anda."
  },
  {
    id: "faq-06",
    category: "Pusat Bantuan",
    question: "Bagaimana jika saya mengalami kendala saat transaksi?",
    answer: 'Anda dapat langsung memanfaatkan menu "Pusat Bantuan" di pojok kanan atas atau bagian footer untuk menyampaikan kendala. Tim Customer Support kami siaga melalui WhatsApp resmi dan live email.'
  }
];

// src/utils/ticketing-logic.ts
function verifyAndCheckInTicket(ticket, nowIso = (/* @__PURE__ */ new Date()).toISOString()) {
  if (ticket.checkInStatus === "checked_in") {
    return {
      success: false,
      message: `Tiket ${ticket.ticketCode} sudah pernah check-in pada ${ticket.checkInTime || "sebelumnya"}.`,
      checkInStatus: "checked_in",
      checkInTime: ticket.checkInTime
    };
  }
  return {
    success: true,
    message: `Check-in berhasil untuk tiket ${ticket.ticketCode}!`,
    checkInStatus: "checked_in",
    checkInTime: nowIso
  };
}

// server.ts
dotenv.config();
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
var isProduction = process.env.NODE_ENV === "production";
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
var LOCAL_STORAGE_FILE = path.resolve(process.cwd(), "database", "local_data.json");
var memoryUsers = [...INITIAL_USERS];
var memoryEvents = JSON.parse(JSON.stringify(INITIAL_EVENTS));
var memoryOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
var memoryVouchers = JSON.parse(JSON.stringify(INITIAL_VOUCHERS));
var memoryPayouts = JSON.parse(JSON.stringify(INITIAL_PAYOUTS));
var memorySettings = JSON.parse(JSON.stringify(DEFAULT_PLATFORM_SETTINGS));
var memorySupportTickets = JSON.parse(JSON.stringify(INITIAL_SUPPORT_TICKETS));
var memoryFaqs = JSON.parse(JSON.stringify(INITIAL_FAQS));
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
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(dataToSave, null, 2), "utf8");
  } catch (err) {
    console.warn("[Storage] Gagal menyimpan database/local_data.json:", err);
  }
}
function loadLocalData() {
  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const content = fs.readFileSync(LOCAL_STORAGE_FILE, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.users) && parsed.users.length) memoryUsers = parsed.users;
      if (Array.isArray(parsed.events)) memoryEvents = parsed.events;
      if (Array.isArray(parsed.orders)) memoryOrders = parsed.orders;
      if (Array.isArray(parsed.vouchers)) memoryVouchers = parsed.vouchers;
      if (Array.isArray(parsed.payouts)) memoryPayouts = parsed.payouts;
      if (parsed.settings) memorySettings = parsed.settings;
      if (Array.isArray(parsed.supportTickets)) memorySupportTickets = parsed.supportTickets;
      if (Array.isArray(parsed.faqs)) memoryFaqs = parsed.faqs;
      console.log("[Storage] Data lokal berhasil dimuat dari database/local_data.json");
    }
  } catch (err) {
    console.warn("[Storage] Gagal membaca database/local_data.json, menggunakan data awal:", err);
  }
}
loadLocalData();
var mysqlPool = null;
var isMysqlActive = false;
var mysqlLastError = "";
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
        connectTimeout: 4e3
      });
      const connection = await mysqlPool.getConnection();
      await connection.ping();
      connection.release();
      isMysqlActive = true;
      mysqlLastError = "";
      console.log(`[Database] Terkoneksi ke MySQL Host: ${host}, Database: ${database}`);
    } catch (err) {
      isMysqlActive = false;
      mysqlLastError = err?.message || "Gagal terhubung ke MySQL";
      console.warn(`[Database] MySQL tidak aktif atau belum siap (${mysqlLastError}). Menggunakan penyimpanan in-memory yang stabil.`);
    }
  } else {
    isMysqlActive = false;
    mysqlLastError = "Variabel environment MYSQL_HOST belum disetel. Berjalan dalam mode Local In-Memory.";
  }
}
initMysql();
app.get("/api/db-status", async (_req, res) => {
  let latency = 0;
  if (isMysqlActive && mysqlPool) {
    try {
      const start = Date.now();
      await mysqlPool.query("SELECT 1");
      latency = Date.now() - start;
    } catch {
      isMysqlActive = false;
    }
  }
  res.json({
    isConfigured: Boolean(process.env.MYSQL_HOST),
    mode: isMysqlActive ? "mysql" : "local-storage",
    host: process.env.MYSQL_HOST || "Local File Storage (database/local_data.json)",
    database: process.env.MYSQL_DATABASE || "celebes_event_db (File Storage)",
    user: process.env.MYSQL_USER || "root",
    connected: isMysqlActive,
    latencyMs: latency,
    tableCounts: {
      users: memoryUsers.length,
      events: memoryEvents.length,
      orders: memoryOrders.length,
      vouchers: memoryVouchers.length,
      payouts: memoryPayouts.length
    },
    message: isMysqlActive ? "Database MySQL/MariaDB aktif dan terhubung normal ke hosting." : "Berjalan dalam mode Standalone File Storage (database/local_data.json). Aplikasi aktif 100% dan data tersimpan permanen tanpa perlu MySQL."
  });
});
app.post("/api/test-mysql", async (req, res) => {
  const { host, user, password, database, port } = req.body;
  try {
    const testPool = mysql.createPool({
      host: host || "localhost",
      port: Number(port) || 3306,
      user,
      password,
      database,
      connectTimeout: 4e3
    });
    const conn = await testPool.getConnection();
    await conn.ping();
    conn.release();
    await testPool.end();
    res.json({ success: true, message: `Koneksi ke MySQL database '${database}' berhasil!` });
  } catch (err) {
    res.status(400).json({ success: false, message: `Koneksi gagal: ${err.message}` });
  }
});
app.get("/api/export-sql", (_req, res) => {
  const schemaPath = path.resolve(process.cwd(), "database", "schema.sql");
  if (fs.existsSync(schemaPath)) {
    const sqlContent = fs.readFileSync(schemaPath, "utf8");
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", 'attachment; filename="celebes_event_mysql.sql"');
    res.send(sqlContent);
  } else {
    res.status(404).json({ error: "File schema.sql tidak ditemukan" });
  }
});
app.get("/api/events", (req, res) => {
  const { category, search, status, creatorId } = req.query;
  let results = [...memoryEvents];
  if (category && category !== "Semua") {
    results = results.filter((e) => e.category.toLowerCase().includes(String(category).toLowerCase()));
  }
  if (status) {
    results = results.filter((e) => e.status === status);
  }
  if (creatorId) {
    results = results.filter((e) => e.creatorId === creatorId);
  }
  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(
      (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.venueName && e.venueName.toLowerCase().includes(q)
    );
  }
  res.json(results);
});
app.get("/api/events/:idOrSlug", (req, res) => {
  const param = req.params.idOrSlug;
  const event = memoryEvents.find((e) => e.id === param || e.slug === param || e.socialShareSlug === param);
  if (!event) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  res.json(event);
});
app.post("/api/events", (req, res) => {
  const newEvent = {
    ...req.body,
    id: `evt-${Date.now()}`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memoryEvents.unshift(newEvent);
  saveLocalData();
  res.status(201).json(newEvent);
});
app.put("/api/events/:id", (req, res) => {
  const { id } = req.params;
  const index = memoryEvents.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  memoryEvents[index] = {
    ...memoryEvents[index],
    ...req.body,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveLocalData();
  res.json(memoryEvents[index]);
});
app.delete("/api/events/:id", (req, res) => {
  const { id } = req.params;
  memoryEvents = memoryEvents.filter((e) => e.id !== id);
  saveLocalData();
  res.json({ success: true, message: "Event berhasil dihapus" });
});
app.get("/api/orders", (req, res) => {
  const { userId, eventId } = req.query;
  let results = [...memoryOrders];
  if (userId) {
    results = results.filter((o) => o.userId === userId);
  }
  if (eventId) {
    results = results.filter((o) => o.eventId === eventId);
  }
  res.json(results);
});
app.post("/api/orders", (req, res) => {
  const orderData = req.body;
  const newOrder = {
    ...orderData,
    id: `ord-${Date.now()}`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const event = memoryEvents.find((e) => e.id === newOrder.eventId);
  if (event) {
    for (const ticket of newOrder.tickets) {
      const tier = event.tickets.find((t) => t.id === ticket.tierId);
      if (tier) {
        tier.soldCount = (tier.soldCount || 0) + 1;
      }
    }
  }
  memoryOrders.unshift(newOrder);
  saveLocalData();
  res.status(201).json(newOrder);
});
app.post("/api/orders/:id/pay", (req, res) => {
  const { id } = req.params;
  const order = memoryOrders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order tidak ditemukan" });
  }
  order.paymentStatus = "paid";
  order.paidAt = (/* @__PURE__ */ new Date()).toISOString();
  order.paymentReference = req.body.paymentReference || `REF-PAY-${Date.now()}`;
  saveLocalData();
  res.json({ success: true, order });
});
app.post("/api/orders/:id/verify-payment", (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason, verifiedBy } = req.body;
  const order = memoryOrders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order tidak ditemukan" });
  }
  if (status === "paid") {
    order.paymentStatus = "paid";
    order.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    order.verifiedAt = (/* @__PURE__ */ new Date()).toISOString();
    order.verifiedBy = verifiedBy || "Admin Celebes Event";
    order.rejectionReason = void 0;
  } else if (status === "payment_rejected") {
    order.paymentStatus = "payment_rejected";
    order.rejectionReason = rejectionReason || "Bukti transfer tidak valid atau dana belum masuk ke mutasi bank.";
    order.verifiedBy = verifiedBy || "Admin Celebes Event";
    order.verifiedAt = (/* @__PURE__ */ new Date()).toISOString();
  } else {
    return res.status(400).json({ error: "Status verifikasi tidak valid" });
  }
  saveLocalData();
  res.json({ success: true, order, message: status === "paid" ? "Pembayaran berhasil disetujui & E-Ticket aktif!" : "Pembayaran ditolak." });
});
app.get("/api/tickets/:code", (req, res) => {
  const { code } = req.params;
  for (const order of memoryOrders) {
    const tkt = order.tickets.find((t) => t.ticketCode === code || t.qrPayload.includes(code));
    if (tkt) {
      return res.json({ ticket: tkt, order });
    }
  }
  res.status(404).json({ error: "Tiket tidak ditemukan" });
});
app.post("/api/tickets/checkin", (req, res) => {
  const { code, eventId } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Kode tiket tidak boleh kosong" });
  }
  let foundTicket = null;
  let foundOrder = null;
  for (const order of memoryOrders) {
    const tkt = order.tickets.find((t) => t.ticketCode === code || t.qrPayload === code || t.qrPayload.includes(code));
    if (tkt) {
      foundTicket = tkt;
      foundOrder = order;
      break;
    }
  }
  if (!foundTicket || !foundOrder) {
    return res.status(404).json({ success: false, message: "Kode tiket tidak valid atau tidak ditemukan." });
  }
  if (eventId && foundTicket.eventId !== eventId) {
    return res.status(400).json({ success: false, message: "Tiket ini terdaftar untuk event yang berbeda!" });
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
    order: foundOrder
  });
});
app.post("/api/vouchers/validate", (req, res) => {
  const { code, eventId } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: "Masukkan kode voucher" });
  }
  const voucher = memoryVouchers.find((v) => v.code.toUpperCase() === code.trim().toUpperCase() && v.isActive);
  if (!voucher) {
    return res.status(404).json({ valid: false, message: "Kode voucher tidak ditemukan atau sudah tidak aktif." });
  }
  if (voucher.eventId && eventId && voucher.eventId !== eventId) {
    return res.status(400).json({ valid: false, message: "Voucher ini tidak berlaku untuk event ini." });
  }
  if (voucher.usedCount >= voucher.quota) {
    return res.status(400).json({ valid: false, message: "Kuota penggunaan voucher ini sudah habis." });
  }
  res.json({ valid: true, voucher });
});
app.get("/api/payouts", (req, res) => {
  const { creatorId } = req.query;
  let results = [...memoryPayouts];
  if (creatorId) {
    results = results.filter((p) => p.creatorId === creatorId);
  }
  res.json(results);
});
app.post("/api/payouts", (req, res) => {
  const newPayout = {
    ...req.body,
    id: `pay-${Date.now()}`,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memoryPayouts.unshift(newPayout);
  saveLocalData();
  res.status(201).json(newPayout);
});
app.put("/api/payouts/:id", (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;
  const payout = memoryPayouts.find((p) => p.id === id);
  if (!payout) {
    return res.status(404).json({ error: "Permintaan pencairan tidak ditemukan" });
  }
  payout.status = status;
  payout.adminNote = adminNote || payout.adminNote;
  payout.processedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveLocalData();
  res.json(payout);
});
app.get("/api/users", (_req, res) => {
  res.json(memoryUsers);
});
app.get("/api/settings", (_req, res) => {
  res.json(memorySettings);
});
app.put("/api/settings", (req, res) => {
  memorySettings = {
    ...memorySettings,
    ...req.body,
    socialLinks: {
      ...memorySettings.socialLinks,
      ...req.body.socialLinks || {}
    },
    qrisConfig: {
      ...memorySettings.qrisConfig,
      ...req.body.qrisConfig || {}
    }
  };
  saveLocalData();
  res.json({ success: true, settings: memorySettings, message: "Pengaturan platform berhasil disimpan." });
});
app.get("/api/support-tickets", (req, res) => {
  const { status, email } = req.query;
  let results = [...memorySupportTickets];
  if (status) {
    results = results.filter((t) => t.status === status);
  }
  if (email) {
    results = results.filter((t) => t.email.toLowerCase() === String(email).toLowerCase());
  }
  res.json(results);
});
app.post("/api/support-tickets", (req, res) => {
  const { name, email, phone, category, priority, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Nama, email, subjek, dan pesan wajib diisi." });
  }
  const newTicket = {
    id: `supp-${Date.now()}`,
    ticketNumber: `HELP-${(/* @__PURE__ */ new Date()).getFullYear()}${String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`,
    name,
    email,
    phone: phone || "",
    category: category || "lainnya",
    priority: priority || "sedang",
    subject,
    message,
    status: "open",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memorySupportTickets.unshift(newTicket);
  saveLocalData();
  res.status(201).json({ success: true, ticket: newTicket, message: "Tiket bantuan berhasil dikirim! Tim kami akan segera menindaklanjuti." });
});
app.put("/api/support-tickets/:id", (req, res) => {
  const { id } = req.params;
  const { status, adminReply } = req.body;
  const ticket = memorySupportTickets.find((t) => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: "Tiket bantuan tidak ditemukan." });
  }
  if (status) ticket.status = status;
  if (adminReply !== void 0) ticket.adminReply = adminReply;
  ticket.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveLocalData();
  res.json({ success: true, ticket, message: "Tiket bantuan berhasil diperbarui." });
});
app.get("/api/faqs", (_req, res) => {
  res.json(memoryFaqs);
});
app.post("/api/faqs", (req, res) => {
  const newFaq = {
    id: `faq-${Date.now()}`,
    ...req.body
  };
  memoryFaqs.push(newFaq);
  saveLocalData();
  res.status(201).json(newFaq);
});
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Celebes Event berjalan di port ${PORT} (http://localhost:${PORT})`);
  });
}
startServer();
