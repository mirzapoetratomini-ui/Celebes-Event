import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Calendar, 
  ArrowRight,
  KeyRound,
  LogIn
} from 'lucide-react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/seedData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  defaultRole = 'user',
}) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'creator' | 'user'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Quick 1-click login for roles
  const handleQuickRoleLogin = (role: 'admin' | 'creator' | 'user') => {
    const predefined = INITIAL_USERS.find(u => u.role === role) || {
      id: `usr-${role}-${Date.now().toString().slice(-4)}`,
      email: role === 'admin' ? 'admin@tiketnusa.id' : role === 'creator' ? 'kreator@festivanusantara.com' : 'budi.santoso@gmail.com',
      name: role === 'admin' ? 'Super Administrator' : role === 'creator' ? 'Festiva Nusantara Organizer' : 'Budi Santoso',
      role,
      avatar:
        role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
          : role === 'creator'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      auth_provider: 'local',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    const roleTitles: Record<string, string> = {
      admin: 'Super Admin (Akses Penuh Moderasi & Keuangan)',
      creator: 'Kreator Event (Manajemen Acara & Peserta)',
      user: 'Peserta / Pembeli Tiket',
    };

    setNotification(`Berhasil masuk sebagai ${roleTitles[role]}!`);
    setTimeout(() => {
      onLoginSuccess(predefined);
      onClose();
    }, 700);
  };

  const handleCustomFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Check if entered email matches admin or creator
    let determinedRole: UserRole = activeTab;
    if (email.toLowerCase().includes('admin')) determinedRole = 'admin';
    else if (email.toLowerCase().includes('kreator') || email.toLowerCase().includes('creator')) determinedRole = 'creator';

    const user: User = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
      role: determinedRole,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      auth_provider: 'local',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    setNotification(`Selamat datang! Anda masuk sebagai ${determinedRole.toUpperCase()}.`);
    setTimeout(() => {
      onLoginSuccess(user);
      onClose();
    }, 700);
  };

  const handleSocialAuth = (provider: 'google' | 'facebook' | 'twitter') => {
    const user: User = {
      id: `usr-${provider}-${Date.now().toString().slice(-6)}`,
      email: `${provider}.user@gmail.com`,
      name: activeTab === 'creator' ? 'Festiva Nusantara' : 'Budi Santoso',
      role: activeTab === 'admin' ? 'admin' : activeTab,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      auth_provider: provider as any,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    setNotification(`Berhasil terhubung via ${provider.toUpperCase()}!`);
    setTimeout(() => {
      onLoginSuccess(user);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
              Portal Akses Multi-User
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-400" />
              Masuk ke TiketNusa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border-b border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Portal Akses:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setEmail('admin@tiketnusa.id');
                  setPassword('demo123');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('creator');
                  setEmail('kreator@festivanusantara.com');
                  setPassword('demo123');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeTab === 'creator'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Kreator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('user');
                  setEmail('budi.santoso@gmail.com');
                  setPassword('demo123');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeTab === 'user'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Peserta</span>
              </button>
            </div>
          </div>

          {/* Quick 1-Click Login Recommendation Banner */}
          <div className="p-3.5 rounded-2xl border text-xs space-y-2 bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                {activeTab === 'admin' && 'Login Instan Super Admin'}
                {activeTab === 'creator' && 'Login Instan Kreator Event'}
                {activeTab === 'user' && 'Login Instan Peserta'}
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                1-Klik
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {activeTab === 'admin' && 'Akses penuh kontrol panel, moderasi semua event, approval penarikan dana, dan database.'}
              {activeTab === 'creator' && 'Akses studio pembuatan event, form dinamis, daftar peserta, dan scanner tiket.'}
              {activeTab === 'user' && 'Akses riwayat pembelian, formulir pendaftaran, dan cetak QR e-ticket.'}
            </p>
            <button
              type="button"
              onClick={() => handleQuickRoleLogin(activeTab)}
              className={`w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  : activeTab === 'creator'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              <span>Masuk Sekarang sebagai {activeTab === 'admin' ? 'Super Admin' : activeTab === 'creator' ? 'Kreator' : 'Peserta'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="shrink-0 mx-3 text-slate-400 text-[11px] uppercase font-semibold">
              atau via email & password
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleCustomFormLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tiketnusa.id"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              Masuk dengan Kredensial
            </button>
          </form>

          {/* Google Sign In Option */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSocialAuth('google')}
              className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Lanjut Menggunakan Akun Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
