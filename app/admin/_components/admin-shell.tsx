'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from './admin-sidebar';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(r => {
        if (!r.ok) throw new Error('not authed');
        return r.json();
      })
      .then(() => setAuthed(true))
      .catch(() => {
        setAuthed(false);
        router.push('/admin/login');
      });
  }, [router]);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <main className="md:ml-56 pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
