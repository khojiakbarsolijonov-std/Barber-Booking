'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../_components/admin-shell';
import { Bell, Filter } from 'lucide-react';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/notifications').then(r => r.json()).then(d => setNotifs(d ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getStatusColor = (s: string) => {
    if (s === 'sent') return 'text-green-400';
    if (s === 'failed') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Xabarnomalar</h1>
        <p className="text-sm text-muted-foreground">Telegram xabarnomalar logi</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-card rounded-xl h-16 animate-pulse" />)}</div>
      ) : (notifs?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell size={32} className="mx-auto mb-2 opacity-50" />
          <p>Xabarnomalar hali yo&apos;q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(notifs ?? []).map((n: any) => (
            <div key={n?.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs bg-muted px-2 py-0.5 rounded">{n?.type ?? ''}</span>
                <span className={`text-xs ${getStatusColor(n?.status)}`}>{n?.status ?? ''}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{n?.message ?? ''}</p>
              <p className="text-xs text-muted-foreground mt-1">{n?.customer?.name ?? ''} • {n?.createdAt ? new Date(n.createdAt).toLocaleString('uz-UZ', { timeZone: 'UTC' }) : ''}</p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
