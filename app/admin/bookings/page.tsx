'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../_components/admin-shell';
import { Calendar, Filter, Check, X, Clock, Phone, User, Plus, Search, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual booking modal state
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', serviceId: '', date: '', startTime: '' });

  const getEffectiveDate = () => {
    if (datePreset === 'today') {
      return new Date().toISOString().split('T')[0];
    }
    if (datePreset === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }
    if (datePreset === 'custom') {
      return customDate;
    }
    return '';
  };

  const loadData = () => {
    setLoading(true);
    let url = '/api/admin/appointments?';
    if (statusFilter) url += `status=${statusFilter}&`;
    const effDate = getEffectiveDate();
    if (effDate) url += `date=${effDate}&`;
    if (serviceFilter) url += `serviceId=${serviceFilter}&`;
    fetch(url)
      .then(r => r.json())
      .then(d => setAppointments(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/admin/services')
      .then(r => r.json())
      .then(d => setServices(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => { 
    loadData(); 
  }, [statusFilter, datePreset, customDate, serviceFilter]);

  // Load available slots for manual booking
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
    const today = new Date().toISOString().split('T')[0];
    setForm({ name: '', phone: '+998 ', serviceId: services[0]?.id ?? '', date: today, startTime: '' });
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
      new: { label: 'Yangi', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
      confirmed: { label: 'Tasdiqlangan', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
      in_progress: { label: 'Jarayonda', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
      completed: { label: 'Bajarildi', cls: 'bg-white/10 text-stone-300 border-white/10' },
      cancelled: { label: 'Bekor', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
      no_show: { label: 'Kelmadi', cls: 'bg-stone-800 text-stone-500 border-stone-700' },
    };
    const s = map[status ?? ''] ?? { label: status, cls: 'bg-stone-800 text-stone-400 border-stone-700' };
    return (
      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  const formatDate = (d: any) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('uz-UZ', { timeZone: 'UTC' });
  };

  const filteredAppointments = appointments.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (a?.customer?.name ?? '').toLowerCase();
    const phone = (a?.customer?.phone ?? '').toLowerCase();
    const service = (a?.service?.name ?? '').toLowerCase();
    return name.includes(q) || phone.includes(q) || service.includes(q);
  });

  return (
    <AdminShell>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Bronlar Jurnali</h1>
          <p className="text-xs text-stone-400">Barcha mijozlar navbatlari va qabul ro&apos;yxati</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E5C365] text-[#121316] rounded-lg text-xs font-semibold hover:brightness-110 transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Yangi bron qo&apos;shish</span>
        </button>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="bg-[#181A20] border border-white/[0.08] rounded-xl p-3 sm:p-4 mb-6 space-y-3">
        {/* Date presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Barcha sanalar' },
              { id: 'today', label: 'Bugun' },
              { id: 'tomorrow', label: 'Ertaga' },
              { id: 'custom', label: 'Boshqa sana' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDatePreset(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  datePreset === tab.id 
                    ? 'bg-white/10 text-white border border-white/20' 
                    : 'text-stone-400 hover:text-white border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {datePreset === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            )}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ism yoki telefon qidirish..."
              className="w-full pl-9 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-stone-400"
            />
          </div>
        </div>

        {/* Status & Service secondary filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06] text-xs">
          <span className="text-stone-500">Holat:</span>
          {[
            { id: '', label: 'Barchasi' },
            { id: 'confirmed', label: 'Tasdiqlangan' },
            { id: 'completed', label: 'Bajarildi' },
            { id: 'cancelled', label: 'Bekor' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === s.id 
                  ? 'bg-[#E5C365]/20 text-[#E5C365] border border-[#E5C365]/30' 
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-stone-500">Xizmat:</span>
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-md px-2 py-1 text-[11px] text-white focus:outline-none"
            >
              <option value="">Barcha xizmatlar</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Scannable Table / Mobile Agenda */}
      {loading ? (
        <div className="bg-[#181A20] border border-white/[0.08] rounded-xl p-8 text-center text-xs text-stone-400">
          Bronlar yuklanmoqda...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-[#181A20] border border-white/[0.08] rounded-xl p-12 text-center text-stone-400">
          <Calendar size={32} className="mx-auto mb-2 opacity-40 text-stone-500" />
          <p className="text-sm font-medium text-white">Bronlar topilmadi</p>
          <p className="text-xs text-stone-500 mt-1">Filtr parametrlarini o&apos;zgartirib ko&apos;ring</p>
        </div>
      ) : (
        <div className="bg-[#181A20] border border-white/[0.08] rounded-xl overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 border-b border-white/[0.08] text-stone-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Vaqt & Sana</th>
                  <th className="py-3 px-4">Mijoz</th>
                  <th className="py-3 px-4">Xizmat</th>
                  <th className="py-3 px-4 text-right">Summa</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredAppointments.map(a => {
                  const isFinished = a.status === 'completed';
                  const isCancelled = a.status === 'cancelled' || a.status === 'no_show';
                  return (
                    <tr 
                      key={a.id} 
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isFinished ? 'opacity-70' : isCancelled ? 'opacity-40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-white tabular-nums text-sm">{a.startTime} — {a.endTime}</p>
                        <p className="text-[11px] text-stone-400">{formatDate(a.date)}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-white">{a?.customer?.name ?? 'Noma\'lum'}</p>
                        <a 
                          href={`tel:${a?.customer?.phone}`} 
                          className="text-[11px] text-stone-400 hover:text-[#E5C365] flex items-center gap-1 mt-0.5"
                        >
                          <Phone size={10} />
                          <span>{a?.customer?.phone}</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-white">{a?.service?.name ?? ''}</p>
                        {a.notes && (
                          <p className="text-[11px] text-[#E5C365] mt-0.5 line-clamp-1">{a.notes}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <p className="font-semibold tabular-nums text-white">
                          {(a?.price ?? 0).toLocaleString('uz-UZ')} so&apos;m
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(a.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {!isFinished && !isCancelled && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => updateStatus(a.id, 'completed')}
                              className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 text-[11px] font-medium transition-colors"
                            >
                              Bajarildi
                            </button>
                            <button
                              onClick={() => updateStatus(a.id, 'cancelled')}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-stone-400 text-[11px] transition-colors"
                            >
                              Bekor
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Agenda Cards */}
          <div className="md:hidden divide-y divide-white/[0.06]">
            {filteredAppointments.map(a => {
              const isFinished = a.status === 'completed';
              const isCancelled = a.status === 'cancelled' || a.status === 'no_show';
              return (
                <div 
                  key={a.id} 
                  className={`p-4 space-y-2.5 ${
                    isFinished ? 'opacity-70' : isCancelled ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold tabular-nums text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                        {a.startTime} — {a.endTime}
                      </span>
                      <span className="text-xs text-stone-400 ml-2">{formatDate(a.date)}</span>
                    </div>
                    {getStatusBadge(a.status)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-white">{a?.customer?.name}</p>
                      <a href={`tel:${a?.customer?.phone}`} className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                        <Phone size={11} /> {a?.customer?.phone}
                      </a>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-400">{a?.service?.name}</p>
                      <p className="text-xs font-semibold tabular-nums text-white mt-0.5">
                        {(a?.price ?? 0).toLocaleString('uz-UZ')} so&apos;m
                      </p>
                    </div>
                  </div>

                  {a.notes && (
                    <div className="text-[11px] text-[#E5C365] p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">
                      {a.notes}
                    </div>
                  )}

                  {!isFinished && !isCancelled && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                      <button
                        onClick={() => updateStatus(a.id, 'completed')}
                        className="flex-1 py-1.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-medium"
                      >
                        Xizmat ko&apos;rsatildi
                      </button>
                      <button
                        onClick={() => updateStatus(a.id, 'cancelled')}
                        className="px-3 py-1.5 rounded bg-white/5 text-stone-400 text-xs"
                      >
                        Bekor
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181A20] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">Yangi bron kiritish</h3>
              <button onClick={() => setShowAdd(false)} className="text-stone-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Mijoz ismi *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ali Valiyev"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Telefon raqam *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white tabular-nums"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Xizmat turi *</label>
                <select
                  value={form.serviceId}
                  onChange={e => setForm({ ...form, serviceId: e.target.value })}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration} min - {s.price.toLocaleString()} so&apos;m)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-400 block mb-1">Sana *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Boshlanish vaqti *</label>
                  {slotsLoading ? (
                    <div className="py-2 text-stone-500 text-xs">Tekshirilmoqda...</div>
                  ) : slots.length === 0 ? (
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={e => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                    />
                  ) : (
                    <select
                      value={form.startTime}
                      onChange={e => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                    >
                      <option value="">Vaqtni tanlang</option>
                      {slots.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-stone-300 hover:bg-white/5 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={createBooking}
                  className="flex-1 py-2.5 rounded-lg bg-[#E5C365] text-[#121316] font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : 'Bron qilish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
