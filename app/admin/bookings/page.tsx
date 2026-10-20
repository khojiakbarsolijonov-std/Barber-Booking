'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../_components/admin-shell';
import { Calendar, Filter, Check, X, Clock, Phone, User, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Manual booking modal state
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', serviceId: '', date: '', startTime: '' });

  const loadData = () => {
    setLoading(true);
    let url = '/api/admin/appointments?';
    if (statusFilter) url += `status=${statusFilter}&`;
    if (dateFilter) url += `date=${dateFilter}&`;
    if (serviceFilter) url += `serviceId=${serviceFilter}&`;
    fetch(url)
      .then(r => r.json())
      .then(d => setAppointments(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Load services dynamically so the filter always reflects the current list
  useEffect(() => {
    fetch('/api/admin/services')
      .then(r => r.json())
      .then(d => setServices(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadData(); }, [statusFilter, dateFilter, serviceFilter]);

  // Load available slots for the chosen service + date
  useEffect(() => {
    if (!showAdd || !form.serviceId || !form.date) { setSlots([]); return; }
    setSlotsLoading(true);
    fetch(`/api/availability?serviceId=${form.serviceId}&date=${form.date}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setSlots(Array.isArray(d?.slots) ? d.slots : []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [showAdd, form.serviceId, form.date]);

  const openAdd = () => {
    setForm({ name: '', phone: '', serviceId: '', date: '', startTime: '' });
    setSlots([]);
    setShowAdd(true);
  };

  const createBooking = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.serviceId || !form.date || !form.startTime) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Bron qo\'shildi');
        setShowAdd(false);
        loadData();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.error ?? 'Xatolik');
      }
    } catch {
      toast.error('Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success('Status yangilandi');
        loadData();
      }
    } catch {
      toast.error('Xatolik');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      new: { label: 'Yangi', cls: 'bg-blue-500/20 text-blue-400' },
      confirmed: { label: 'Tasdiqlangan', cls: 'bg-emerald-500/20 text-emerald-400' },
      in_progress: { label: 'Jarayonda', cls: 'bg-amber-500/20 text-amber-400' },
      completed: { label: 'Bajarildi', cls: 'bg-green-500/20 text-green-400' },
      cancelled: { label: 'Bekor', cls: 'bg-red-500/20 text-red-400' },
      no_show: { label: 'Kelmadi', cls: 'bg-gray-500/20 text-muted-foreground' },
    };
    const s = map[status ?? ''] ?? { label: status, cls: 'bg-gray-500/20 text-muted-foreground' };
    return <span className={`text-xs px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  const formatDate = (d: any) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('uz-UZ', { timeZone: 'UTC' });
  };

  // When the booking was actually created (Farg'ona vaqti, UTC+5)
  const formatCreatedAt = (d: any) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleString('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Bronlar</h1>
          <p className="text-sm text-muted-foreground">Barcha bronlar ro&apos;yxati</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#C8A97E] text-black rounded-lg text-sm font-bold hover:bg-[#b89a6f] transition-colors"
        >
          <Plus size={16} /> Bron qilish
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e: any) => setStatusFilter(e?.target?.value ?? '')}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          <option value="">Barchasi</option>
          <option value="new">Yangi</option>
          <option value="confirmed">Tasdiqlangan</option>
          <option value="completed">Bajarildi</option>
          <option value="cancelled">Bekor</option>
          <option value="no_show">Kelmadi</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e: any) => setDateFilter(e?.target?.value ?? '')}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        />
        <select
          value={serviceFilter}
          onChange={(e: any) => setServiceFilter(e?.target?.value ?? '')}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          <option value="">Barcha xizmatlar</option>
          {(services ?? []).map((s: any) => (
            <option key={s?.id} value={s?.id}>{s?.name}</option>
          ))}
        </select>
        {(statusFilter || dateFilter || serviceFilter) && (
          <button onClick={() => { setStatusFilter(''); setDateFilter(''); setServiceFilter(''); }} className="text-xs text-[#C8A97E] hover:underline">
            Tozalash
          </button>
        )}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-card rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : (appointments?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar size={32} className="mx-auto mb-2 opacity-50" />
          <p>Bronlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(appointments ?? []).map((a: any) => (
            <div key={a?.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    {a?.customer?.name ?? 'Noma\'lum'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone size={10} /> <span suppressHydrationWarning>{a?.customer?.phone ?? ''}</span>
                    {a?.customer?.telegramId && <span className="ml-1 text-[#0088cc]">TG</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                    <Clock size={10} /> Bron: {formatCreatedAt(a?.createdAt)}
                  </span>
                  {getStatusBadge(a?.status)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="text-[#C8A97E]">{a?.service?.name ?? ''}</span>
                <span>{formatDate(a?.date)}</span>
                <span>{a?.startTime ?? ''} - {a?.endTime ?? ''}</span>
                <span className="font-mono">{((a?.price ?? 0)).toLocaleString('uz-UZ')} so&apos;m</span>
              </div>
              {(a?.status === 'confirmed' || a?.status === 'new') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(a.id, 'completed')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition-colors"
                  >
                    <Check size={14} /> Xizmat ko&apos;rsatildi
                  </button>
                  <button
                    onClick={() => updateStatus(a.id, 'cancelled')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                  >
                    <X size={14} /> Bekor qilish
                  </button>
                  <button
                    onClick={() => updateStatus(a.id, 'no_show')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/20 text-muted-foreground rounded-lg text-xs hover:bg-gray-500/30 transition-colors"
                  >
                    Kelmadi
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manual booking modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowAdd(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Yangi bron</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-muted rounded"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Mijoz ismi</label>
                <input
                  value={form.name}
                  onChange={(e: any) => setForm({ ...form, name: e?.target?.value ?? '' })}
                  placeholder="Ism"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telefon</label>
                <input
                  value={form.phone}
                  onChange={(e: any) => setForm({ ...form, phone: e?.target?.value ?? '' })}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Xizmat</label>
                <select
                  value={form.serviceId}
                  onChange={(e: any) => setForm({ ...form, serviceId: e?.target?.value ?? '', startTime: '' })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Xizmatni tanlang</option>
                  {(services ?? []).map((s: any) => (
                    <option key={s?.id} value={s?.id}>{s?.name} — {((s?.price ?? 0)).toLocaleString('uz-UZ')} so&apos;m</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sana</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e: any) => setForm({ ...form, date: e?.target?.value ?? '', startTime: '' })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vaqt</label>
                {!form.serviceId || !form.date ? (
                  <p className="text-xs text-muted-foreground py-2">Avval xizmat va sanani tanlang</p>
                ) : slotsLoading ? (
                  <p className="text-xs text-muted-foreground py-2">Yuklanmoqda...</p>
                ) : (slots?.length ?? 0) === 0 ? (
                  <p className="text-xs text-red-400 py-2">Bu kunga bo&apos;sh vaqt yo&apos;q</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {(slots ?? []).map((t: string) => (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, startTime: t })}
                        className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${form.startTime === t ? 'bg-[#C8A97E] text-black border-[#C8A97E] font-bold' : 'bg-muted border-border text-foreground hover:border-[#C8A97E]'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={createBooking}
                disabled={saving}
                className="w-full mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#C8A97E] text-black rounded-lg text-sm font-bold hover:bg-[#b89a6f] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saqlanmoqda...' : <><Check size={16} /> Bronni saqlash</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
