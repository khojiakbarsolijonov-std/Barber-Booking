'use client';

import { useEffect, useState, use } from 'react';
import AdminShell from '../../_components/admin-shell';
import { User, Phone, Send, Calendar, Clock, ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then(r => r.json())
      .then(d => { setCustomer(d); setNotes(d?.notes ?? ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const saveNotes = async () => {
    try {
      await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      toast.success('Eslatma saqlandi');
    } catch {
      toast.error('Xatolik');
    }
  };

  const formatDate = (d: any) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('uz-UZ', { timeZone: 'UTC' });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'text-green-400', cancelled: 'text-red-400', confirmed: 'text-emerald-400',
      new: 'text-blue-400', no_show: 'text-muted-foreground',
    };
    return <span className={`text-xs ${colors[status ?? ''] ?? 'text-muted-foreground'}`}>{status ?? ''}</span>;
  };

  return (
    <AdminShell>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={16} /> Orqaga
      </button>

      {loading ? (
        <div className="bg-card rounded-xl h-48 animate-pulse" />
      ) : !customer ? (
        <p className="text-muted-foreground">Mijoz topilmadi</p>
      ) : (
        <>
          <div className="bg-card border border-border rounded-xl p-5 mb-4">
            <h2 className="font-display text-xl font-bold mb-3">{customer?.name ?? ''}</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone size={14} /> <span suppressHydrationWarning>{customer?.phone ?? ''}</span>
              </p>
              {customer?.telegramId && (
                <p className="flex items-center gap-2 text-[#0088cc]">
                  <Send size={14} /> Telegram ulangan {customer?.telegramUsername ? `(@${customer.telegramUsername})` : ''}
                </p>
              )}
              <p className="text-[#C8A97E] font-bold">
                Jami: {((customer?.totalSpent ?? 0)).toLocaleString('uz-UZ')} so&apos;m | {(customer?.appointments?.length ?? 0)} tashrif
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold mb-2">Eslatmalar</h3>
            <textarea
              value={notes}
              onChange={(e: any) => setNotes(e?.target?.value ?? '')}
              placeholder="Mijoz haqida eslatma..."
              rows={3}
              className="w-full bg-muted rounded-lg p-3 text-sm text-foreground border border-border focus:outline-none focus:border-[#C8A97E] resize-none placeholder:text-muted-foreground"
            />
            <button onClick={saveNotes} className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-[#C8A97E]/20 text-[#C8A97E] rounded-lg text-xs hover:bg-[#C8A97E]/30">
              <Save size={12} /> Saqlash
            </button>
          </div>

          {/* Appointment history */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Tashriflar tarixi</h3>
            <div className="space-y-2">
              {(customer?.appointments ?? []).map((a: any) => (
                <div key={a?.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm">{a?.service?.name ?? ''}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a?.date)} | {a?.startTime ?? ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">{((a?.price ?? 0)).toLocaleString('uz-UZ')}</p>
                    {getStatusBadge(a?.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
