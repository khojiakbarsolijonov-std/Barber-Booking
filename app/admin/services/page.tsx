'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../_components/admin-shell';
import { Scissors, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', rebookingReminderDays: '' });

  const load = () => {
    fetch('/api/admin/services').then(r => r.json()).then(d => setServices(d ?? [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', duration: '', rebookingReminderDays: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration) { toast.error('Nom, narx va davomiylik kerak'); return; }
    const body = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      duration: Number(form.duration),
      rebookingReminderDays: form.rebookingReminderDays ? Number(form.rebookingReminderDays) : null,
    };
    try {
      const url = editId ? `/api/admin/services/${editId}` : '/api/admin/services';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(editId ? 'Yangilandi' : 'Qo\'shildi');
        resetForm();
        load();
      } else {
        toast.error('Xatolik');
      }
    } catch { toast.error('Tarmoq xatosi'); }
  };

  const handleEdit = (s: any) => {
    setForm({
      name: s?.name ?? '',
      description: s?.description ?? '',
      price: String(s?.price ?? ''),
      duration: String(s?.duration ?? ''),
      rebookingReminderDays: s?.rebookingReminderDays ? String(s.rebookingReminderDays) : '',
    });
    setEditId(s?.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Rostdan o\'chirmoqchimisiz?')) return;
    try {
      await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      toast.success('O\'chirildi');
      load();
    } catch { toast.error('Xatolik'); }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Xizmatlar</h1>
          <p className="text-sm text-muted-foreground">Xizmatlarni boshqaring</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 px-4 py-2 bg-[#C8A97E] text-black rounded-lg text-sm font-bold hover:bg-[#b89a6f]">
          <Plus size={16} /> Qo&apos;shish
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{editId ? 'Tahrirlash' : 'Yangi xizmat'}</h3>
            <button onClick={resetForm}><X size={18} className="text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e: any) => setForm({ ...form, name: e?.target?.value ?? '' })} placeholder="Xizmat nomi" className="bg-muted rounded-lg px-3 py-2.5 text-sm border border-border text-foreground focus:outline-none focus:border-[#C8A97E]" />
            <input value={form.description} onChange={(e: any) => setForm({ ...form, description: e?.target?.value ?? '' })} placeholder="Tavsif" className="bg-muted rounded-lg px-3 py-2.5 text-sm border border-border text-foreground focus:outline-none focus:border-[#C8A97E]" />
            <input type="number" value={form.price} onChange={(e: any) => setForm({ ...form, price: e?.target?.value ?? '' })} placeholder="Narx (so'm)" className="bg-muted rounded-lg px-3 py-2.5 text-sm border border-border text-foreground focus:outline-none focus:border-[#C8A97E]" />
            <input type="number" value={form.duration} onChange={(e: any) => setForm({ ...form, duration: e?.target?.value ?? '' })} placeholder="Davomiylik (daqiqa)" className="bg-muted rounded-lg px-3 py-2.5 text-sm border border-border text-foreground focus:outline-none focus:border-[#C8A97E]" />
            <input type="number" value={form.rebookingReminderDays} onChange={(e: any) => setForm({ ...form, rebookingReminderDays: e?.target?.value ?? '' })} placeholder="Eslatma kunlar (masalan 20)" className="bg-muted rounded-lg px-3 py-2.5 text-sm border border-border text-foreground focus:outline-none focus:border-[#C8A97E]" />
          </div>
          <button onClick={handleSave} className="mt-3 flex items-center gap-1 px-4 py-2 bg-[#C8A97E] text-black rounded-lg text-sm font-bold hover:bg-[#b89a6f]">
            <Check size={16} /> Saqlash
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-card rounded-xl h-16 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {(services ?? []).map((s: any) => (
            <div key={s?.id} className={`bg-card border border-border rounded-xl p-4 flex items-center ${!s?.isActive ? 'opacity-50' : ''}`}>
              <div className="w-10 h-10 rounded-lg bg-[#C8A97E]/10 flex items-center justify-center mr-3">
                <Scissors size={18} className="text-[#C8A97E]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{s?.name ?? ''}</p>
                <p className="text-xs text-muted-foreground">
                  {((s?.price ?? 0)).toLocaleString('uz-UZ')} so&apos;m • {s?.duration ?? 0} daq
                  {s?.rebookingReminderDays ? ` • eslatma: ${s.rebookingReminderDays} kun` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(s)} className="p-2 hover:bg-muted rounded-lg"><Edit2 size={14} className="text-muted-foreground" /></button>
                <button onClick={() => handleDelete(s?.id)} className="p-2 hover:bg-muted rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
