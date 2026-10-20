'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../_components/admin-shell';
import { RotateCcw } from 'lucide-react';

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reminders').then(r => r.json()).then(d => setReminders(d ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getStatusColor = (s: string) => {
    if (s === 'sent') return 'text-green-400 bg-green-500/20';
    if (s === 'cancelled') return 'text-red-400 bg-red-500/20';
    if (s === 'failed') return 'text-red-400 bg-red-500/20';
    return 'text-yellow-400 bg-yellow-500/20';
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Eslatmalar</h1>
        <p className="text-sm text-muted-foreground">Rebooking eslatmalar tarixi</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-card rounded-xl h-16 animate-pulse" />)}</div>
      ) : (reminders?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <RotateCcw size={32} className="mx-auto mb-2 opacity-50" />
          <p>Eslatmalar hali yo&apos;q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(reminders ?? []).map((r: any) => (
            <div key={r?.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{r?.customer?.name ?? ''}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(r?.status)}`}>{r?.status ?? ''}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {r?.service?.name ?? ''} • {r?.reminderDays ?? 0} kundan so&apos;ng • {r?.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString('uz-UZ', { timeZone: 'UTC' }) : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
