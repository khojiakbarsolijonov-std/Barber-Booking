'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, Scissors, Clock, Settings, Bell, RotateCcw, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bronlar', icon: Calendar },
  { href: '/admin/customers', label: 'Mijozlar', icon: Users },
  { href: '/admin/services', label: 'Xizmatlar', icon: Scissors },
  { href: '/admin/schedule', label: 'Ish jadvali', icon: Clock },
  { href: '/admin/notifications', label: 'Xabarnomalar', icon: Bell },
  { href: '/admin/reminders', label: 'Eslatmalar', icon: RotateCcw },
  { href: '/admin/settings', label: 'Sozlamalar', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => setOpen(true)} className="p-1">
          <Menu size={22} className="text-foreground" />
        </button>
        <span className="font-display font-bold text-[#C8A97E]">Jasurbek Barber</span>
        <div className="w-8" />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-[#C8A97E]">Admin</span>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item: any) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active ? 'bg-[#C8A97E]/20 text-[#C8A97E]' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-muted mt-4">
              <LogOut size={18} /> Chiqish
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-card border-r border-border flex-col p-4 z-40">
        <div className="mb-8">
          <h2 className="font-display font-bold text-[#C8A97E] text-lg">Jasurbek Barber</h2>
          <p className="text-xs text-muted-foreground">Boshqaruv paneli</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item: any) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-[#C8A97E]/20 text-[#C8A97E]' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-muted">
          <LogOut size={18} /> Chiqish
        </button>
      </div>
    </>
  );
}
