'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, Scissors, Clock, Settings, Bell, RotateCcw, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

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

const MOBILE_BOTTOM_TABS = [
  { href: '/admin', label: 'Bugun', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bronlar', icon: Calendar },
  { href: '/admin/customers', label: 'Mijozlar', icon: Users },
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
      {/* Mobile top header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#121316]/95 backdrop-blur-md border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setOpen(true)} className="p-1 text-stone-300 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm text-white">Jasurbek Barber</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border border-[#C5A880]/30 text-[#C5A880] bg-[#C5A880]/10">
          Admin
        </span>
      </div>

      {/* Mobile slide-out drawer for all menu items */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#181A20] border-r border-white/10 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-sm text-white">Jasurbek Barber</h3>
                  <p className="text-[11px] text-stone-400">Boshqaruv markazi</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.href}
                      onClick={() => { router.push(item.href); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active 
                          ? 'bg-[#C5A880]/15 text-[#C5A880]' 
                          : 'text-stone-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-[#181A20] border-r border-white/[0.08] flex-col p-4 z-40">
        <div className="mb-8 px-2">
          <h2 className="font-bold text-base text-white tracking-tight">Jasurbek Barber</h2>
          <p className="text-xs text-stone-400">Boshqaruv paneli</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  active 
                    ? 'bg-[#C5A880]/15 text-[#C5A880]' 
                    : 'text-stone-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors mt-auto"
        >
          <LogOut size={16} />
          <span>Chiqish</span>
        </button>
      </div>

      {/* Mobile Persistent Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#181A20]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-2 flex items-center justify-around">
        {MOBILE_BOTTOM_TABS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                active ? 'text-[#C5A880]' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
