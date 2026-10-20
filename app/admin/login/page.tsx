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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#C8A97E]/20 flex items-center justify-center mx-auto mb-4">
            <Scissors size={28} className="text-[#C8A97E]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Jasurbek Barber boshqaruv paneli</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Login</label>
            <input
              type="text"
              value={username}
              onChange={(e: any) => setUsername(e?.target?.value ?? '')}
              placeholder="admin"
              className="w-full px-4 py-3 bg-card rounded-xl border border-border text-foreground focus:outline-none focus:border-[#C8A97E] placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Parol</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e: any) => setPassword(e?.target?.value ?? '')}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-card rounded-xl border border-border text-foreground focus:outline-none focus:border-[#C8A97E] placeholder:text-muted-foreground"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#C8A97E] text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#b89a6f] transition-colors disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><LogIn size={18} /> Kirish</>}
          </button>
        </form>
      </div>
    </div>
  );
}
