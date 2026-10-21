'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, LogIn, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!username || !password) { toast.error('Login va parolni kiriting'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error ?? 'Login xatosi');
        setLoading(false);
        return;
      }
      router.push('/admin');
    } catch {
      toast.error('Tarmoq xatosi');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121316] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#181A20] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
            <Scissors size={22} className="text-[#E5C365]" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Boshqaruvi</h1>
          <p className="text-stone-400 text-xs mt-1">Jasurbek Barber boshqaruv paneli</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-stone-300 mb-1.5 block font-medium">Login</label>
            <input
              type="text"
              value={username}
              onChange={(e: any) => setUsername(e?.target?.value ?? '')}
              placeholder="admin"
              className="w-full px-3.5 py-2.5 bg-black/30 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-[#E5C365] placeholder:text-stone-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-stone-300 mb-1.5 block font-medium">Parol</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e: any) => setPassword(e?.target?.value ?? '')}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-11 bg-black/30 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-[#E5C365] placeholder:text-stone-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#E5C365] text-[#121316] rounded-xl font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-[#121316] border-t-transparent rounded-full animate-spin" /> : <><LogIn size={15} /> Kirish</>}
          </button>
        </form>
      </div>
    </div>
  );
}
