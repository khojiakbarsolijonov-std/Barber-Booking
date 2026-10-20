'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../_components/admin-shell';
import { Clock, Plus, Trash2, Save, Calendar, Ban } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [daysOff, setDaysOff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDayOff, setNewDayOff] = useState({ date: '', reason: '' });
  const [newBlock, setNewBlock] = useState({ date: '', startTime: '', endTime: '', label: '' });

  const load = () => {
    fetch('/api/admin/schedule').then(r => r.json()).then(d => {
      setSchedule(d?.schedule ?? []);
      setBreaks(d?.breaks ?? []);
      setDaysOff(d?.daysOff ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const saveSchedule = async () => {
    try {
      await fetch('/api/admin/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });
      toast.success('Ish jadvali saqlandi');
    } catch { toast.error('Xatolik'); }
  };

  const updateDay = (dayOfWeek: number, field: string, value: any) => {
    setSchedule((prev: any[]) => (prev ?? []).map((s: any) =>
      s?.dayOfWeek === dayOfWeek ? { ...(s ?? {}), [field]: value } : s
    ));
  };

  const addDayOff = async () => {
    if (!newDayOff.date) { toast.error('Sana tanlang'); return; }
    try {
      await fetch('/api/admin/dayoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDayOff),
      });
      toast.success('Dam olish kuni qo\'shildi');
      setNewDayOff({ date: '', reason: '' });
      load();
    } catch { toast.error('Xatolik'); }
  };

  const removeDayOff = async (id: string) => {
    await fetch(`/api/admin/dayoff/${id}`, { method: 'DELETE' });
    load();
  };

  const addBlock = async () => {
    if (!newBlock.date || !newBlock.startTime || !newBlock.endTime) { toast.error('Sana va vaqt oralig\'ini kiriting'); return; }
    if (newBlock.startTime >= newBlock.endTime) { toast.error('Tugash vaqti boshlanish vaqtidan keyin bo\'lsin'); return; }
    try {
      await fetch('/api/admin/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newBlock.date,
          startTime: newBlock.startTime,
          endTime: newBlock.endTime,
          label: newBlock.label?.trim() || 'Bandman',
        }),
      });
      toast.success('Vaqt yopildi');
      setNewBlock({ date: '', startTime: '', endTime: '', label: '' });
      load();
    } catch { toast.error('Xatolik'); }
  };

  const removeBlock = async (id: string) => {
    await fetch(`/api/admin/breaks/${id}`, { method: 'DELETE' });
    load();
  };

  // Only date-specific blocks (personal time-off), not recurring weekly breaks
  const dateBlocks = (breaks ?? []).filter((b: any) => b?.date);

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Ish jadvali</h1>
        <p className="text-sm text-muted-foreground">Haftalik jadval va dam olish kunlari</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(7)].map((_, i) => <div key={i} className="bg-card rounded-xl h-14 animate-pulse" />)}</div>
      ) : (
        <>
          {/* Weekly Schedule */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock size={16} className="text-[#C8A97E]" /> Haftalik jadval</h3>
            <div className="space-y-3">
              {(schedule ?? []).map((s: any) => (
                <div key={s?.dayOfWeek} className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 w-28">
                    <input
                      type="checkbox"
                      checked={s?.isWorking ?? false}
                      onChange={(e: any) => updateDay(s.dayOfWeek, 'isWorking', e?.target?.checked ?? false)}
                      className="accent-[#C8A97E]"
                    />
                    <span className="text-sm">{DAYS[s?.dayOfWeek ?? 0] ?? ''}</span>
                  </label>
                  {s?.isWorking && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={s?.startTime ?? '09:00'}
                        onChange={(e: any) => updateDay(s.dayOfWeek, 'startTime', e?.target?.value ?? '09:00')}
                        className="bg-muted rounded px-2 py-1 text-sm text-foreground border border-border"
                      />
                      <span className="text-muted-foreground">—</span>
                      <input
                        type="time"
                        value={s?.endTime ?? '20:00'}
                        onChange={(e: any) => updateDay(s.dayOfWeek, 'endTime', e?.target?.value ?? '20:00')}
                        className="bg-muted rounded px-2 py-1 text-sm text-foreground border border-border"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={saveSchedule} className="mt-4 flex items-center gap-1 px-4 py-2 bg-[#C8A97E] text-black rounded-lg text-sm font-bold hover:bg-[#b89a6f]">
              <Save size={14} /> Saqlash
            </button>
          </div>

          {/* Days Off */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar size={16} className="text-[#C8A97E]" /> Dam olish kunlari</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              <input
                type="date"
                value={newDayOff.date}
                onChange={(e: any) => setNewDayOff({ ...newDayOff, date: e?.target?.value ?? '' })}
                className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border"
              />
              <input
                value={newDayOff.reason}
                onChange={(e: any) => setNewDayOff({ ...newDayOff, reason: e?.target?.value ?? '' })}
                placeholder="Sabab (ixtiyoriy)"
                className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border flex-1"
              />
              <button onClick={addDayOff} className="flex items-center gap-1 px-3 py-2 bg-[#C8A97E]/20 text-[#C8A97E] rounded-lg text-sm hover:bg-[#C8A97E]/30">
                <Plus size={14} /> Qo&apos;shish
              </button>
            </div>
            {(daysOff?.length ?? 0) > 0 && (
              <div className="space-y-1">
                {(daysOff ?? []).map((d: any) => (
                  <div key={d?.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm">{d?.date ? new Date(d.date).toLocaleDateString('uz-UZ', { timeZone: 'UTC' }) : ''} {d?.reason ? `(${d.reason})` : ''}</span>
                    <button onClick={() => removeDayOff(d?.id)} className="p-1 hover:bg-muted rounded"><Trash2 size={14} className="text-red-400" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Block time ranges (personal time-off) */}
          <div className="bg-card border border-border rounded-xl p-4 mt-4">
            <h3 className="font-semibold mb-1 flex items-center gap-2"><Ban size={16} className="text-[#C8A97E]" /> Vaqtlarni yopish (Bandman)</h3>
            <p className="text-xs text-muted-foreground mb-3">Shaxsiy ish chiqib qolganda, tanlangan kunning ma&apos;lum vaqt oralig&apos;ini yoping — u mijozlarga bo&apos;sh ko&apos;rinmaydi.</p>
            <div className="flex gap-2 mb-3 flex-wrap items-end">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Sana</label>
                <input
                  type="date"
                  value={newBlock.date}
                  onChange={(e: any) => setNewBlock({ ...newBlock, date: e?.target?.value ?? '' })}
                  className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Dan</label>
                <input
                  type="time"
                  value={newBlock.startTime}
                  onChange={(e: any) => setNewBlock({ ...newBlock, startTime: e?.target?.value ?? '' })}
                  className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Gacha</label>
                <input
                  type="time"
                  value={newBlock.endTime}
                  onChange={(e: any) => setNewBlock({ ...newBlock, endTime: e?.target?.value ?? '' })}
                  className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border"
                />
              </div>
              <input
                value={newBlock.label}
                onChange={(e: any) => setNewBlock({ ...newBlock, label: e?.target?.value ?? '' })}
                placeholder="Sabab (ixtiyoriy)"
                className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border flex-1 min-w-[120px]"
              />
              <button onClick={addBlock} className="flex items-center gap-1 px-3 py-2 bg-[#C8A97E]/20 text-[#C8A97E] rounded-lg text-sm hover:bg-[#C8A97E]/30">
                <Plus size={14} /> Yopish
              </button>
            </div>
            {(dateBlocks?.length ?? 0) > 0 && (
              <div className="space-y-1">
                {(dateBlocks ?? []).map((b: any) => (
                  <div key={b?.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm flex items-center gap-2">
                      <Ban size={13} className="text-red-400" />
                      {b?.date ? new Date(b.date).toLocaleDateString('uz-UZ', { timeZone: 'UTC' }) : ''}
                      <span className="text-muted-foreground">{b?.startTime} — {b?.endTime}</span>
                      {b?.label ? <span className="text-xs text-muted-foreground">({b.label})</span> : ''}
                    </span>
                    <button onClick={() => removeBlock(b?.id)} className="p-1 hover:bg-muted rounded"><Trash2 size={14} className="text-red-400" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AdminShell>
  );
}
