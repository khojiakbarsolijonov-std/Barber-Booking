'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../_components/admin-shell';
import { Users, Search, Phone, Send, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetch(`/api/admin/customers?search=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(d => setCustomers(d ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Mijozlar</h1>
        <p className="text-sm text-muted-foreground">CRM — barcha mijozlar ro&apos;yxati</p>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e: any) => setSearch(e?.target?.value ?? '')}
          placeholder="Ism yoki telefon..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-[#E5C365] placeholder:text-muted-foreground"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-card rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : (customers?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users size={32} className="mx-auto mb-2 opacity-50" />
          <p>Mijozlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(customers ?? []).map((c: any) => (
            <button
              key={c?.id}
              onClick={() => router.push(`/admin/customers/${c?.id}`)}
              className="w-full bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/80 transition-colors flex items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{c?.name ?? ''}</span>
                  {c?.telegramId && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0088cc]/20 text-[#0088cc]">TG</span>}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1"><Phone size={10} /> <span suppressHydrationWarning>{c?.phone ?? ''}</span></span>
                  <span>{c?.totalVisits ?? 0} tashrif</span>
                  <span className="text-[#E5C365]">{((c?.totalSpent ?? 0)).toLocaleString('uz-UZ')} so&apos;m</span>
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
