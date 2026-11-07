import React, { useState, useEffect } from 'react';
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
  LogIn,
  Building2,
  Phone,
  MapPin,
  CreditCard,
  Instagram,
  Globe,
  AlertCircle,
  HelpCircle,
  Award,
  Crown
} from 'lucide-react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/seedData';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  defaultRole?: UserRole;
  initialMode?: 'login' | 'register_creator' | 'register_user';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  defaultRole = 'creator',
  initialMode = 'login',
}) => {
  const [modalMode, setModalMode] = useState<'login' | 'register_creator' | 'register_user'>(initialMode);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'admin' | 'creator' | 'user'>('admin');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);

  // Creator Registration State
  const [creatorForm, setCreatorForm] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    password: '',
    category: 'Konser Musik & Festival',
    city: 'Makassar',
    bankName: 'BCA',
    bankAccountNumber: '',
    bankAccountName: '',
    instagram: '',
    portfolioUrl: '',
    agreeTerms: true,
  });
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(false);

  // Participant Registration State
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [userError, setUserError] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // General Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalMode(initialMode);
      setNotification(null);
      setLoginError(null);
      setCreatorError(null);
      setUserError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // 1-Click Super Admin Login specifically for user
  const handleSuperAdminLogin = async () => {
    setIsLoadingLogin(true);
    setLoginError(null);
    try {
      const result = await api.login('redaksibergulircom@gmail.com', 'Bergulir2026!#');
      setNotification('✅ Berhasil masuk sebagai Super Admin Bergulir Media!');
      setTimeout(() => {
        onLoginSuccess(result.user);
        onClose();
      }, 600);
    } catch {
      // Fallback predefined
      const adminFallback = INITIAL_USERS[0];
      setNotification('✅ Berhasil masuk sebagai Super Admin Bergulir Media!');
      setTimeout(() => {
        onLoginSuccess(adminFallback);
        onClose();
      }, 600);
    } finally {
      setIsLoadingLogin(false);
    }
  };

  // Quick 1-click login for testing
  const handleQuickRoleLogin = (role: 'admin' | 'creator' | 'user') => {
    const predefined = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    const roleTitles: Record<string, string> = {
      admin: 'Super Admin (Akses Penuh Moderasi & Keuangan)',
      creator: 'Kreator Event (Manajemen Acara & Peserta)',
      user: 'Peserta / Pembeli Tiket',
    };

    setNotification(`Berhasil masuk sebagai ${roleTitles[role]}!`);
    setTimeout(() => {
      onLoginSuccess(predefined);
      onClose();
    }, 600);
  };

  // Standard Form Login
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      setLoginError('Alamat email wajib diisi!');
      return;
    }

    setIsLoadingLogin(true);
    setLoginError(null);

    try {
      const res = await api.login(loginEmail, loginPassword);
      setNotification(`Selamat datang kembali, ${res.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(res.user);
        onClose();
      }, 600);
    } catch (err: any) {
      setLoginError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setIsLoadingLogin(false);
    }
  };

  // Creator Onboarding Registration
  const handleRegisterCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatorError(null);

    if (!creatorForm.name.trim()) {
      setCreatorError('Nama lengkap penanggung jawab (PIC) wajib diisi!');
      return;
    }
    if (!creatorForm.organization.trim()) {
      setCreatorError('Nama organisasi / event organizer wajib diisi!');
      return;
    }
    if (!creatorForm.email.trim() || !creatorForm.email.includes('@')) {
      setCreatorError('Alamat email valid wajib diisi untuk akun penyelenggara!');
      return;
    }
    if (!creatorForm.phone.trim()) {
      setCreatorError('Nomor WhatsApp aktif wajib diisi untuk koordinasi & notifikasi tiket!');
      return;
    }
    if (!creatorForm.password || creatorForm.password.length < 6) {
      setCreatorError('Password minimal 6 karakter demi keamanan akun!');
      return;
    }
    if (!creatorForm.agreeTerms) {
      setCreatorError('Anda harus menyetujui Syarat & Ketentuan Kemitraan Kreator Event.');
      return;
    }

    setIsLoadingCreator(true);

    try {
      const payload: Partial<User> = {
        name: creatorForm.name.trim(),
        organization: creatorForm.organization.trim(),
        email: creatorForm.email.trim().toLowerCase(),
        phone: creatorForm.phone.trim(),
        password: creatorForm.password,
        role: 'creator',
        category: creatorForm.category,
        city: creatorForm.city,
        bankName: creatorForm.bankName,
        bankAccountNumber: creatorForm.bankAccountNumber.trim(),
        bankAccountName: creatorForm.bankAccountName.trim() || creatorForm.name.trim(),
        instagram: creatorForm.instagram.trim(),
        portfolioUrl: creatorForm.portfolioUrl.trim(),
        status: 'active',
      };

      const res = await api.registerCreator(payload);
      setNotification(`🎉 Selamat! Pendaftaran organisasi "${creatorForm.organization}" berhasil. Akun Anda aktif!`);
      setTimeout(() => {
        onLoginSuccess(res.user);
        onClose();
      }, 800);
    } catch (err: any) {
      setCreatorError(err.message || 'Pendaftaran kreator gagal. Silakan coba lagi.');
    } finally {
      setIsLoadingCreator(false);
    }
  };

  // Participant Registration
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);

    if (!userForm.name.trim()) {
      setUserError('Nama lengkap wajib diisi!');
      return;
    }
    if (!userForm.email.trim() || !userForm.email.includes('@')) {
      setUserError('Alamat email valid wajib diisi!');
      return;
    }
    if (!userForm.password || userForm.password.length < 6) {
      setUserError('Password minimal 6 karakter!');
      return;
    }

    setIsLoadingUser(true);

    try {
      const payload: Partial<User> = {
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        phone: userForm.phone.trim(),
        password: userForm.password,
        role: 'user',
        status: 'active',
      };

      const res = await api.registerUser(payload);
      setNotification(`✅ Pendaftaran berhasil! Selamat datang, ${res.user.name}.`);
      setTimeout(() => {
        onLoginSuccess(res.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setUserError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoadingUser(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
              Celebes Event & Ticketing Portal
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {modalMode === 'login' && <LogIn className="w-5 h-5 text-blue-400" />}
              {modalMode === 'register_creator' && <Calendar className="w-5 h-5 text-cyan-400" />}
              {modalMode === 'register_user' && <UserIcon className="w-5 h-5 text-emerald-400" />}
              <span>
                {modalMode === 'login' && 'Masuk ke Akun Anda'}
                {modalMode === 'register_creator' && 'Daftar Calon Kreator & Penyelenggara'}
                {modalMode === 'register_user' && 'Daftar Akun Peserta / Pembeli'}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border-b border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="p-4 sm:p-6 pb-2">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setModalMode('login');
                setLoginError(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                modalMode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span>Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalMode('register_creator');
                setCreatorError(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                modalMode === 'register_creator'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daftar Kreator</span>
              <span className="hidden sm:inline text-[9px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-extrabold uppercase">
                Mitra EO
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalMode('register_user');
                setUserError(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                modalMode === 'register_user'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daftar Peserta</span>
            </button>
          </div>
        </div>

        {/* MODAL CONTENT CONTAINER */}
        <div className="p-4 sm:p-6 pt-2 max-h-[72vh] overflow-y-auto space-y-5">

          {/* ======================================================== */}
          {/* TAB 1: MASUK / LOGIN */}
          {/* ======================================================== */}
          {modalMode === 'login' && (
            <div className="space-y-4">
              
              {/* SUPER ADMIN DEDICATED QUICK LOGIN CARD (User Requested) */}
              <div className="p-4 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white text-slate-900 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                        Super Admin Akun Utama
                        <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-mono font-bold">
                          Owner
                        </span>
                      </h4>
                      <p className="text-[11px] text-purple-700 font-medium">
                        redaksibergulircom@gmail.com
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                    Akses Penuh
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-purple-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-mono font-bold text-slate-800">redaksibergulircom@gmail.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Password:</span>
                    <span className="font-mono font-bold text-slate-800">Bergulir2026!#</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSuperAdminLogin}
                  disabled={isLoadingLogin}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isLoadingLogin ? 'Memproses Masuk...' : 'Masuk Langsung sebagai Super Admin'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-200 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Standard Form Login */}
              <form onSubmit={handleFormLogin} className="space-y-3 pt-1">
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink-0 mx-3 text-slate-400 text-[11px] uppercase font-semibold">
                    atau masuk dengan kredensial Anda
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="email@organisasi.com atau redaksibergulircom@gmail.com"
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
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoadingLogin}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoadingLogin ? 'Sedang Memeriksa...' : 'Masuk ke Akun'}</span>
                </button>
              </form>

              {/* Quick Testing Short-cuts */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Belum punya akun penyelenggara?</span>
                <button
                  type="button"
                  onClick={() => setModalMode('register_creator')}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Daftar Calon Kreator
                </button>
              </div>

              {/* Quick Preset Buttons for Testing */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('creator')}
                  className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Demo Kreator EO
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('user')}
                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Demo Peserta
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: DAFTAR CALON KREATOR (CREATOR ONBOARDING) */}
          {/* ======================================================== */}
          {modalMode === 'register_creator' && (
            <form onSubmit={handleRegisterCreator} className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-950">
                      Pendaftaran Mitra Penyelenggara & Event Organizer
                    </h4>
                    <p className="text-[11px] text-blue-800/80 leading-relaxed mt-0.5">
                      Daftarkan lembaga atau brand Anda untuk langsung menerbitkan tiket berbayar/gratis, kustomisasi formulir peserta, scan QR tiket, dan terima hasil penjualan tiket.
                    </p>
                  </div>
                </div>
              </div>

              {creatorError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-200 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{creatorError}</span>
                </div>
              )}

              {/* SECTION A: INFORMASI PENANGGUNG JAWAB & ORGANISASI */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Profil Lembaga / Event Organizer</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Organisasi / Event Organizer <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={creatorForm.organization}
                      onChange={(e) => setCreatorForm({ ...creatorForm, organization: e.target.value })}
                      placeholder="Contoh: Celebes Creative Promosindo"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama PIC / Penanggung Jawab <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={creatorForm.name}
                      onChange={(e) => setCreatorForm({ ...creatorForm, name: e.target.value })}
                      placeholder="Contoh: Rahmat Hidayat"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Resmi Penyelenggara (Untuk Login) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={creatorForm.email}
                        onChange={(e) => setCreatorForm({ ...creatorForm, email: e.target.value })}
                        placeholder="eo@organisasi.id"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={creatorForm.phone}
                        onChange={(e) => setCreatorForm({ ...creatorForm, phone: e.target.value })}
                        placeholder="08123456789"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Password Akun <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={creatorForm.password}
                        onChange={(e) => setCreatorForm({ ...creatorForm, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kota / Wilayah Basis
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={creatorForm.city}
                        onChange={(e) => setCreatorForm({ ...creatorForm, city: e.target.value })}
                        placeholder="Contoh: Makassar / Gowa / Manado"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Event Utama yang Biasa Digelar
                  </label>
                  <select
                    value={creatorForm.category}
                    onChange={(e) => setCreatorForm({ ...creatorForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Konser Musik & Festival">Konser Musik & Festival</option>
                    <option value="Seminar & Workshop">Seminar, Workshop & Konferensi</option>
                    <option value="Olahraga & Marathon">Olahraga, Fun Run & Marathon</option>
                    <option value="Festival Budaya & Kuliner">Festival Budaya, Kuliner & Expo</option>
                    <option value="Pameran & Bazar Komunitas">Pameran Seni, Bazar & Komunitas</option>
                    <option value="Keagamaan & Tabligh">Keagamaan & Pengajian Akbar</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* SECTION B: REKENING PENCAIRAN TIKET */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Rekening Bank untuk Pencairan Penjualan Tiket</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Digunakan untuk mentransfer hasil penjualan tiket event Anda setelah verifikasi panitia.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Bank
                    </label>
                    <select
                      value={creatorForm.bankName}
                      onChange={(e) => setCreatorForm({ ...creatorForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BCA">BCA</option>
                      <option value="Bank Mandiri">Bank Mandiri</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="BSI">BSI (Bank Syariah)</option>
                      <option value="Bank Sulselbar">Bank Sulselbar</option>
                      <option value="CIMB Niaga">CIMB Niaga</option>
                      <option value="Permata">Bank Permata</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      value={creatorForm.bankAccountNumber}
                      onChange={(e) => setCreatorForm({ ...creatorForm, bankAccountNumber: e.target.value })}
                      placeholder="Nomor rekening"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Atas Nama Rekening
                    </label>
                    <input
                      type="text"
                      value={creatorForm.bankAccountName}
                      onChange={(e) => setCreatorForm({ ...creatorForm, bankAccountName: e.target.value })}
                      placeholder="Nama di buku tabungan"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: MEDIA SOSIAL & PORTOFOLIO */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>3. Akun Media Sosial & Tautan Portofolio (Opsional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Instagram Organisasi
                    </label>
                    <div className="relative">
                      <Instagram className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={creatorForm.instagram}
                        onChange={(e) => setCreatorForm({ ...creatorForm, instagram: e.target.value })}
                        placeholder="@namaorganisasi"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Website / Portofolio Event
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={creatorForm.portfolioUrl}
                        onChange={(e) => setCreatorForm({ ...creatorForm, portfolioUrl: e.target.value })}
                        placeholder="https://organisasi.com"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* TERMS CHECKBOX */}
              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={creatorForm.agreeTerms}
                    onChange={(e) => setCreatorForm({ ...creatorForm, agreeTerms: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Saya menyatakan data organisasi di atas adalah benar dan menyetujui Ketentuan Kerjasama Penyelenggara Event di Celebes Event & Bergulir Media.
                  </span>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isLoadingCreator}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {isLoadingCreator ? 'Mendaftarkan Organisasi...' : 'Selesaikan Pendaftaran & Masuk ke Kreator Studio'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: DAFTAR PESERTA / PEMBELI TIKET */}
          {/* ======================================================== */}
          {modalMode === 'register_user' && (
            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Pendaftaran Akun Peserta & Pembeli Tiket
                    </h4>
                    <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                      Daftar akun gratis untuk menyimpan e-ticket, cetak kartu akses QR, dan riwayat transaksi event Anda.
                    </p>
                  </div>
                </div>
              </div>

              {userError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-200 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{userError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="budi@gmail.com"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      placeholder="08123456789"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoadingUser}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                <span>{isLoadingUser ? 'Membuat Akun...' : 'Daftar sebagai Peserta'}</span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
