'use client';

import { useEffect, useState } from 'react';
import AdminShell from './admin-shell';
import { Calendar, DollarSign, Users, Clock, Check, X, Phone, Plus, ChevronRight, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AppointmentItem {
  id: string;
  customer: string;
  phone: string;
  service: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
  notes?: string | null;
}

interface DashboardData {
  todayBookings: number;
  todayCompleted: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  pendingReminders: number;
  totalCustomers: number;
  todayAppointments?: AppointmentItem[];
  nextAppointment: any;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadDashboard = () => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success('Status yangilandi');
        loadDashboard();
      }
    } catch {
      toast.error('Xatolik');
    }
  };

  const formatPrice = (n: number) => (n ?? 0).toLocaleString('uz-UZ') + " so'm";

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      new: { label: 'Yangi', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
      confirmed: { label: 'Tasdiqlangan', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
      completed: { label: 'Bajarildi', cls: 'bg-white/10 text-stone-300 border-white/10' },
      cancelled: { label: 'Bekor', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
      no_show: { label: 'Kelmadi', cls: 'bg-stone-800 text-stone-500 border-stone-700' },
    };
    const s = map[status] ?? { label: status, cls: 'bg-stone-800 text-stone-400 border-stone-700' };
    return (
      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  const todayDateStr = new Date().toLocaleDateString('uz-UZ', { 
    timeZone: 'Asia/Tashkent', 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <AdminShell>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Kreslo Nazorati & Dashboard</h1>
          <p className="text-xs text-stone-400 capitalize mt-0.5">{todayDateStr}</p>
        </div>

        <button 
          onClick={() => router.push('/admin/bookings')} 
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C5A880] text-[#121316] text-xs font-semibold hover:brightness-110 transition-all self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Yangi bron qo&apos;shish</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-card rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Active / Immediate Next Client Banner */}
          {data?.nextAppointment ? (
            <div className="p-4 sm:p-5 rounded-xl border border-[#C5A880]/30 bg-[#181A20] shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
                  Navbatdagi mijoz
                </span>
                <span className="text-xs font-semibold tabular-nums text-white bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                  {data.nextAppointment.startTime} — {data.nextAppointment.endTime}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{data.nextAppointment.customer}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mt-1">
                    <span>{data.nextAppointment.service}</span>
                    <span>•</span>
                    <a 
                      href={`tel:${data.nextAppointment.phone}`}
                      className="text-[#C5A880] hover:underline flex items-center gap-1"
                    >
                      <Phone size={11} /> {data.nextAppointment.phone}
                    </a>
                    <span>•</span>
                    <span className="font-semibold text-white tabular-nums">{formatPrice(data.nextAppointment.price)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStatus(data.nextAppointment.id, 'completed')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                  >
                    <Check size={14} />
                    <span>Xizmat ko&apos;rsatildi</span>
                  </button>
                  <button
                    onClick={() => updateStatus(data.nextAppointment.id, 'no_show')}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 border border-white/10 text-xs transition-colors"
                  >
                    Kelmadi
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#181A20] flex items-center justify-between text-xs text-stone-400">
              <span>Hozirda kutilayotgan navbat yo&apos;q</span>
              <span className="text-stone-500">Bugungi jadval toza</span>
            </div>
          )}

          {/* Business KPI Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#181A20] border border-white/[0.08] rounded-xl p-3.5">
              <span className="text-[11px] text-stone-400 block mb-1">Bugungi tushum</span>
              <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{formatPrice(data?.todayRevenue ?? 0)}</p>
            </div>
            <div className="bg-[#181A20] border border-white/[0.08] rounded-xl p-3.5">
              <span className="text-[11px] text-stone-400 block mb-1">Bugungi qabul</span>
              <p className="text-lg sm:text-xl font-bold text-white tabular-nums">
                {data?.todayCompleted ?? 0} <span className="text-xs text-stone-400 font-normal">/ {data?.todayBookings ?? 0}</span>
              </p>
            </div>
            <div className="bg-[#181A20] border border-white/[0.08] rounded-xl p-3.5">
              <span className="text-[11px] text-stone-400 block mb-1">Shu hafta tushum</span>
              <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{formatPrice(data?.weekRevenue ?? 0)}</p>
            </div>
            <div className="bg-[#181A20] border border-white/[0.08] rounded-xl p-3.5">
              <span className="text-[11px] text-stone-400 block mb-1">Shu oy tushum</span>
              <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{formatPrice(data?.monthRevenue ?? 0)}</p>
            </div>
          </div>

          {/* Today's Live Schedule Timeline */}
          <div className="bg-[#181A20] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-white">Bugungi qabul jadvali</h3>
                <p className="text-xs text-stone-400">Barcha bugungi bronlar va ularning holati</p>
              </div>
              <button
                onClick={() => router.push('/admin/bookings')}
                className="text-xs text-[#C5A880] hover:underline flex items-center gap-1"
              >
                <span>Barcha bronlar</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {(!data?.todayAppointments || data.todayAppointments.length === 0) ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  Bugungi kunga hech qanday bron qayd etilmagan.
                </div>
              ) : (
                data.todayAppointments.map((appt) => {
                  const isFinished = appt.status === 'completed';
                  const isCancelled = appt.status === 'cancelled' || appt.status === 'no_show';
                  return (
                    <div 
                      key={appt.id} 
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isFinished ? 'opacity-60 bg-white/[0.01]' : isCancelled ? 'opacity-40' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-16 py-1 text-center rounded bg-white/5 border border-white/10 text-xs font-semibold tabular-nums text-white shrink-0">
                          {appt.startTime}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{appt.customer}</span>
                            {getStatusBadge(appt.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400 mt-0.5">
                            <span>{appt.service}</span>
                            <span>•</span>
                            <span className="tabular-nums font-medium text-stone-300">{formatPrice(appt.price)}</span>
                            {appt.notes && (
                              <>
                                <span>•</span>
                                <span className="text-[#C5A880]">{appt.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!isFinished && !isCancelled && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => updateStatus(appt.id, 'completed')}
                            className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 text-xs transition-colors"
                            title="Xizmat ko'rsatildi"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, 'no_show')}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 border border-white/10 text-xs transition-colors"
                            title="Kelmadi"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}
    </AdminShell>
  );
}
