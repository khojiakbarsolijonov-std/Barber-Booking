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
      <div className="min-h-screen bg-[#121316] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5C365] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-[#121316] text-stone-100">
      <AdminSidebar />
      <main className="md:ml-56 pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-6 pb-24 md:pb-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
