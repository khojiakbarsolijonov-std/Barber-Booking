'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import AdminShell from '../_components/admin-shell';
import { Settings, Save, Upload, Moon, Sun, User } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => setSettings(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...(prev ?? {}), [key]: value }));
  };

  const handleUpload = async (e: any) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data?.url) {
        update('avatarUrl', data.url);
        toast.success('Rasm yuklandi. Saqlashni unutmang!');
      } else {
        toast.error(data?.error ?? 'Yuklashda xatolik');
      }
    } catch { toast.error('Tarmoq xatosi'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) toast.success('Sozlamalar saqlandi');
      else toast.error('Xatolik');
    } catch { toast.error('Tarmoq xatosi'); }
    finally { setSaving(false); }
  };

  const currentAvatar = settings?.avatarUrl || '/barber-jasurbek.jpg';

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground">Biznes va tizim sozlamalari</p>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl h-96 animate-pulse" />
      ) : (
        <div className="space-y-4">
          <Section title="Ko'rinish (Mavzu)">
            <p className="text-xs text-muted-foreground mb-3">Boshqaruv panelining rang mavzusini tanlang.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  mounted && theme === 'dark' ? 'border-[#C8A97E] bg-[#C8A97E]/15 text-[#C8A97E]' : 'border-border bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon size={16} /> Qorong'i (Dark)
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  mounted && theme === 'light' ? 'border-[#C8A97E] bg-[#C8A97E]/15 text-[#C8A97E]' : 'border-border bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun size={16} /> Yorug' (Light)
              </button>
            </div>
          </Section>

          <Section title="Asosiy rasm (Avatar)">
            <p className="text-xs text-muted-foreground mb-3">Bosh sahifada ko'rinadigan barber rasmi.</p>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-[#C8A97E] shrink-0">
                <Image src={currentAvatar} alt="Avatar" fill className="object-cover" sizes="80px" />
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted hover:bg-accent rounded-lg text-sm font-medium border border-border disabled:opacity-50"
                >
                  {uploading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Upload size={15} />}
                  Rasmni o'zgartirish
                </button>
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG yoki WEBP · max 8MB</p>
              </div>
            </div>
          </Section>

          <Section title="Biznes ma'lumotlari">
            <Field label="Biznes nomi" value={settings?.businessName ?? ''} onChange={(v: string) => update('businessName', v)} />
            <Field label="Barber ismi" value={settings?.barberName ?? ''} onChange={(v: string) => update('barberName', v)} />
            <Field label="Telefon" value={settings?.phone ?? ''} onChange={(v: string) => update('phone', v)} />
            <Field label="Manzil" value={settings?.address ?? ''} onChange={(v: string) => update('address', v)} />
            <Field label="Instagram" value={settings?.instagram ?? ''} onChange={(v: string) => update('instagram', v)} />
            <Field label="Telegram username" value={settings?.telegramUsername ?? ''} onChange={(v: string) => update('telegramUsername', v)} />
          </Section>

          <Section title="Bron sozlamalari">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slot interval (daqiqa)" value={String(settings?.slotInterval ?? 30)} onChange={(v: string) => update('slotInterval', Number(v))} type="number" />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rang</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings?.accentColor ?? '#C8A97E'}
                    onChange={(e: any) => update('accentColor', e?.target?.value ?? '#C8A97E')}
                    className="w-10 h-10 rounded-lg border border-border bg-transparent cursor-pointer"
                  />
                  <span className="text-sm font-mono text-muted-foreground">{settings?.accentColor ?? '#C8A97E'}</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Eslatma sozlamalari">
            <div className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={settings?.rebookingEnabled ?? true} onChange={(e: any) => update('rebookingEnabled', e?.target?.checked)} className="accent-[#C8A97E]" />
              <span className="text-sm">Rebooking eslatmalarini yoqish</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Standart eslatma kunlar" value={String(settings?.defaultRebookingDays ?? 20)} onChange={(v: string) => update('defaultRebookingDays', Number(v))} type="number" />
              <Field label="Eslatma vaqti" value={settings?.rebookingReminderTime ?? '11:00'} onChange={(v: string) => update('rebookingReminderTime', v)} type="time" />
            </div>
            <div className="mt-3">
              <label className="text-xs text-muted-foreground mb-1 block">Eslatma xabar shabloni</label>
              <textarea
                value={settings?.rebookingMessageTemplate ?? ''}
                onChange={(e: any) => update('rebookingMessageTemplate', e?.target?.value ?? '')}
                rows={3}
                className="w-full bg-muted rounded-lg p-3 text-sm text-foreground border border-border focus:outline-none focus:border-[#C8A97E] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Taglar: {'{name}'}, {'{days}'}</p>
            </div>
            <div className="mt-3">
              <label className="text-xs text-muted-foreground mb-1 block">Rahmat xabari</label>
              <textarea
                value={settings?.thankYouMessage ?? ''}
                onChange={(e: any) => update('thankYouMessage', e?.target?.value ?? '')}
                rows={2}
                className="w-full bg-muted rounded-lg p-3 text-sm text-foreground border border-border focus:outline-none focus:border-[#C8A97E] resize-none"
              />
            </div>
          </Section>

          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#C8A97E] text-black rounded-xl font-bold hover:bg-[#b89a6f] disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            Saqlash
          </button>
        </div>
      )}
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><Settings size={14} className="text-[#C8A97E]" /> {title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e: any) => onChange(e?.target?.value ?? '')}
        className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground border border-border focus:outline-none focus:border-[#C8A97E]"
      />
    </div>
  );
}
