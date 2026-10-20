'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Scissors, UserPlus } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!email || !password) { toast.error('Email va parol kiritish shart'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error ?? 'Xatolik');
        setLoading(false);
        return;
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.ok) {
        router.push('/');
      } else {
        toast.error('Tizimga kirish xatosi');
      }
    } catch { toast.error('Tarmoq xatosi'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#C8A97E]/20 flex items-center justify-center mx-auto mb-4">
            <Scissors size={28} className="text-[#C8A97E]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Ro&apos;yxatdan o&apos;tish</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={(e: any) => setName(e?.target?.value ?? '')} placeholder="Ism" className="w-full px-4 py-3 bg-zinc-900 rounded-xl border border-zinc-800 text-white focus:outline-none focus:border-[#C8A97E]" />
          <input type="email" value={email} onChange={(e: any) => setEmail(e?.target?.value ?? '')} placeholder="Email" className="w-full px-4 py-3 bg-zinc-900 rounded-xl border border-zinc-800 text-white focus:outline-none focus:border-[#C8A97E]" />
          <input type="password" value={password} onChange={(e: any) => setPassword(e?.target?.value ?? '')} placeholder="Parol" className="w-full px-4 py-3 bg-zinc-900 rounded-xl border border-zinc-800 text-white focus:outline-none focus:border-[#C8A97E]" />
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#C8A97E] text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#b89a6f] disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><UserPlus size={18} /> Ro&apos;yxatdan o&apos;tish</>}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Akkauntingiz bormi? <a href="/admin/login" className="text-[#C8A97E] hover:underline">Kirish</a>
        </p>
      </div>
    </div>
  );
}
