'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import AdminShell from '../_components/admin-shell';
import { Settings, Save, Upload, Moon, Sun, Palette, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { LUXURY_THEMES } from '@/lib/themes';

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
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Sozlamalar</h1>
        <p className="text-xs text-stone-400">Brending, dizayn mavzulari va biznes sozlamalari</p>
      </div>

      {loading ? (
        <div className="bg-[#181A20] border border-white/10 rounded-xl h-96 animate-pulse" />
      ) : (
        <div className="space-y-5">
          {/* Brand Luxury Theme Picker */}
          <Section icon={Palette} title="Brendning Lyuks Ranglar Mavzusi (Brand Color Theme)">
            <p className="text-xs text-stone-400 mb-3">
              Mijozlarga ko&apos;rinadigan online bron sahifasining eksklyuziv lyuks dizayn palitrasi.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-2">
              {Object.values(LUXURY_THEMES).map((th) => {
                const isSelected = (settings?.themePreset || 'noir-gold') === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      update('themePreset', th.id);
                      update('accentColor', th.primary);
                    }}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all relative overflow-hidden bg-[#111319] ${
                      isSelected
                        ? 'border-2 shadow-xl ring-1 ring-white/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-[#151820]'
                    }`}
                    style={isSelected ? { 
                      borderColor: th.primary, 
                      boxShadow: `0 4px 20px ${th.glow}` 
                    } : {}}
                  >
                    {/* Visual 3-Tone Swatch Box */}
                    <div 
                      className="w-14 h-14 rounded-xl border border-white/15 shrink-0 flex flex-col overflow-hidden shadow-md" 
                      style={{ backgroundColor: th.bg }}
                    >
                      <div className="h-7 w-full border-b border-white/10" style={{ backgroundColor: th.surface }} />
                      <div className="h-7 w-full flex items-center justify-center">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm" 
                          style={{ 
                            backgroundColor: th.primary, 
                            boxShadow: `0 0 10px ${th.glow}` 
                          }} 
                        />
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm text-white truncate">{th.name}</p>
                        {isSelected && (
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border"
                            style={{ 
                              backgroundColor: th.badgeBg, 
                              color: th.primary,
                              borderColor: th.badgeBorder 
                            }}
                          >
                            <Check size={10} strokeWidth={3} />
                            Faol
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-300 mt-1 line-clamp-1">{th.description}</p>
                      <p className="text-[11px] font-mono mt-1.5 flex items-center gap-1.5">
                        <span className="text-stone-400">{th.tagline}</span>
                        <span className="text-stone-600">•</span>
                        <span className="font-bold tabular-nums" style={{ color: th.primary }}>{th.primary}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Admin Appearance Mode */}
          <Section icon={Moon} title="Boshqaruv Paneli Rejimi">
            <p className="text-xs text-stone-400 mb-3">Admin panelining ko&apos;rinish rejimi.</p>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                  mounted && theme === 'dark' 
                    ? 'border-[#E5C365] bg-[#E5C365]/15 text-[#E5C365]' 
                    : 'border-white/10 bg-black/30 text-stone-400 hover:text-white'
                }`}
              >
                <Moon size={15} /> Qorong&apos;i (Dark)
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                  mounted && theme === 'light' 
                    ? 'border-[#E5C365] bg-[#E5C365]/15 text-[#E5C365]' 
                    : 'border-white/10 bg-black/30 text-stone-400 hover:text-white'
                }`}
              >
                <Sun size={15} /> Yorug&apos; (Light)
              </button>
            </div>
          </Section>

          {/* Barber Avatar Upload */}
          <Section icon={Settings} title="Asosiy rasm (Avatar)">
            <p className="text-xs text-stone-400 mb-3">Bosh sahifada ko&apos;rinadigan barber rasmi.</p>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-900 border-2 border-white/15 shrink-0 shadow-md">
                <Image src={currentAvatar} alt="Avatar" fill className="object-cover" sizes="80px" />
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white border border-white/10 disabled:opacity-50 transition-colors"
                >
                  {uploading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
                  Rasmni o&apos;zgartirish
                </button>
                <p className="text-[11px] text-stone-400 mt-1.5">JPG, PNG yoki WEBP · max 8MB</p>
              </div>
            </div>
          </Section>

          {/* Business Details */}
          <Section icon={Settings} title="Biznes ma'lumotlari">
            <Field label="Biznes nomi" value={settings?.businessName ?? ''} onChange={(v: string) => update('businessName', v)} />
            <Field label="Barber ismi" value={settings?.barberName ?? ''} onChange={(v: string) => update('barberName', v)} />
            <Field label="Telefon" value={settings?.phone ?? ''} onChange={(v: string) => update('phone', v)} />
            <Field label="Manzil" value={settings?.address ?? ''} onChange={(v: string) => update('address', v)} />
            <Field label="Instagram" value={settings?.instagram ?? ''} onChange={(v: string) => update('instagram', v)} />
            <Field label="Telegram username" value={settings?.telegramUsername ?? ''} onChange={(v: string) => update('telegramUsername', v)} />
          </Section>

          {/* Booking & Interval */}
          <Section icon={Settings} title="Bron sozlamalari">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Slot interval (daqiqa)" value={String(settings?.slotInterval ?? 30)} onChange={(v: string) => update('slotInterval', Number(v))} type="number" />
              <div>
                <label className="text-xs text-stone-300 font-medium mb-1.5 block">Maxsus Aksent Rang</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings?.accentColor ?? '#E5C365'}
                    onChange={(e: any) => update('accentColor', e?.target?.value ?? '#E5C365')}
                    className="w-10 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-stone-300 font-semibold">{settings?.accentColor ?? '#E5C365'}</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Automated Reminders */}
          <Section icon={Settings} title="Eslatma sozlamalari">
            <div className="flex items-center gap-2 mb-3">
              <input 
                type="checkbox" 
                checked={settings?.rebookingEnabled ?? true} 
                onChange={(e: any) => update('rebookingEnabled', e?.target?.checked)} 
                className="w-4 h-4 rounded accent-[#E5C365]" 
              />
              <span className="text-xs font-semibold text-white">Rebooking eslatmalarini yoqish</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Standart eslatma kunlar" value={String(settings?.defaultRebookingDays ?? 20)} onChange={(v: string) => update('defaultRebookingDays', Number(v))} type="number" />
              <Field label="Eslatma vaqti" value={settings?.rebookingReminderTime ?? '11:00'} onChange={(v: string) => update('rebookingReminderTime', v)} type="time" />
            </div>
            <div className="mt-3">
              <label className="text-xs text-stone-300 font-medium mb-1.5 block">Eslatma xabar shabloni</label>
              <textarea
                value={settings?.rebookingMessageTemplate ?? ''}
                onChange={(e: any) => update('rebookingMessageTemplate', e?.target?.value ?? '')}
                rows={3}
                className="w-full bg-[#101216] rounded-lg p-3 text-xs text-white border border-white/10 focus:outline-none focus:border-stone-400 resize-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">Taglar: {'{name}'}, {'{days}'}</p>
            </div>
            <div className="mt-3">
              <label className="text-xs text-stone-300 font-medium mb-1.5 block">Rahmat xabari</label>
              <textarea
                value={settings?.thankYouMessage ?? ''}
                onChange={(e: any) => update('thankYouMessage', e?.target?.value ?? '')}
                rows={2}
                className="w-full bg-[#101216] rounded-lg p-3 text-xs text-white border border-white/10 focus:outline-none focus:border-stone-400 resize-none"
              />
            </div>
          </Section>

          {/* Save Button */}
          <div className="pt-2">
            <button 
              onClick={save} 
              disabled={saving} 
              className="flex items-center justify-center gap-2 px-8 py-3 bg-[#E5C365] text-[#121316] rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all shadow-lg"
            >
              {saving ? <div className="w-4 h-4 border-2 border-[#121316] border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              Saqlash
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Section({ icon: Icon = Settings, title, children }: { icon?: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#181A20] border border-white/10 rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold mb-3.5 text-sm flex items-center gap-2 text-white">
        <Icon size={16} className="text-[#E5C365]" /> 
        <span>{title}</span>
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-stone-300 font-medium mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e: any) => onChange(e?.target?.value ?? '')}
        className="w-full bg-[#101216] rounded-xl px-3.5 py-2.5 text-xs text-white border border-white/10 focus:outline-none focus:border-stone-400 transition-colors"
      />
    </div>
  );
}
