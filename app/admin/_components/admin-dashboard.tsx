'use client';

import { useEffect, useState } from 'react';
import AdminShell from './admin-shell';
import { Calendar, DollarSign, Users, Clock, TrendingUp, Bell, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardData {
  todayBookings: number;
  todayCompleted: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  pendingReminders: number;
  totalCustomers: number;
  nextAppointment: any;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (n: number) => (n ?? 0).toLocaleString('uz-UZ') + " so'm";

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Bugungi umumiy ko&apos;rsatkichlar</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Calendar} label="Bugungi bronlar" value={String(data?.todayBookings ?? 0)} />
            <StatCard icon={Clock} label="Xizmat ko'rsatildi" value={String(data?.todayCompleted ?? 0)} />
            <StatCard icon={Users} label="Jami mijozlar" value={String(data?.totalCustomers ?? 0)} />
            <StatCard icon={Bell} label="Kutilayotgan eslatmalar" value={String(data?.pendingReminders ?? 0)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <RevenueCard label="Bugungi tushum" value={formatPrice(data?.todayRevenue ?? 0)} />
            <RevenueCard label="Shu hafta" value={formatPrice(data?.weekRevenue ?? 0)} />
            <RevenueCard label="Shu oy" value={formatPrice(data?.monthRevenue ?? 0)} />
          </div>

          {data?.nextAppointment && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm text-muted-foreground mb-3">Keyingi bron</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{data.nextAppointment?.customer ?? ''}</p>
                  <p className="text-sm text-muted-foreground">{data.nextAppointment?.service ?? ''}</p>
                  <p className="text-sm text-[#C8A97E]">{data.nextAppointment?.startTime ?? ''} - {data.nextAppointment?.endTime ?? ''}</p>
                </div>
                <button onClick={() => router.push('/admin/bookings')} className="p-2 bg-muted rounded-lg hover:bg-accent">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-[#C8A97E]" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono">{value}</p>
    </div>
  );
}

function RevenueCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold text-[#C8A97E] font-mono">{value}</p>
    </div>
  );
}
