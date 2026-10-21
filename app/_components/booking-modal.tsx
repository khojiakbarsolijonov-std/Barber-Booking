'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Check, Clock, Scissors, 
  Calendar, User, Phone, CheckCircle2, Sparkles, Plus,
  ExternalLink, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { LuxuryTheme, getTheme } from '@/lib/themes';

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  imageUrl: string | null;
}

interface Props {
  services: ServiceType[];
  selectedService: ServiceType | null;
  accentColor: string;
  theme?: LuxuryTheme;
  settings: any;
  onClose: () => void;
}

const STEPS = ['Xizmat & Qo\'shimchalar', 'Sana & Vaqt', "Ma'lumotlar", 'Tasdiq'];

const VIP_ADDONS = [
  { id: 'massage', name: 'Bosh & Yuz massaji', price: 40000, duration: 15, desc: 'Issiq sochiq va efir moylari bilan relaks' },
  { id: 'styling', name: 'Premium soch yuvish & styling', price: 25000, duration: 10, desc: 'Import vositalar va fen yordamida shakllantirish' },
  { id: 'mask', name: 'Qora niqob (Black mask)', price: 35000, duration: 15, desc: 'Yuz terisini tozalash va parvarishlash' },
];

export default function BookingModal({ services, selectedService, accentColor, theme, settings, onClose }: Props) {
  const th = theme || getTheme(settings?.themePreset, accentColor);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ServiceType | null>(selectedService ?? services[0] ?? null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Generate 21 days ahead
  const dates = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 21; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      list.push(d.toISOString().split('T')[0] ?? '');
    }
    return list;
  }, []);

  // Pre-select today on mount
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  // Load available slots
  useEffect(() => {
    if (!selectedDate || !service?.id) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    fetch(`/api/availability?date=${selectedDate}&serviceId=${service.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setAvailableSlots(d?.slots ?? []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, service?.id]);

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Group slots by time of day
  const groupedSlots = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    (availableSlots ?? []).forEach(slot => {
      const hour = parseInt(slot.split(':')[0], 10);
      if (hour < 12) morning.push(slot);
      else if (hour < 17) afternoon.push(slot);
      else evening.push(slot);
    });

    return { morning, afternoon, evening };
  }, [availableSlots]);

  // Total price and duration calculation
  const totalPrice = useMemo(() => {
    const base = service?.price ?? 0;
    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const addon = VIP_ADDONS.find(a => a.id === id);
      return sum + (addon ? addon.price : 0);
    }, 0);
    return base + addonsTotal;
  }, [service, selectedAddons]);

  const totalDuration = useMemo(() => {
    const base = service?.duration ?? 0;
    const addonsDur = selectedAddons.reduce((sum, id) => {
      const addon = VIP_ADDONS.find(a => a.id === id);
      return sum + (addon ? addon.duration : 0);
    }, 0);
    return base + addonsDur;
  }, [service, selectedAddons]);

  const handleSubmit = async () => {
    if (!name?.trim()) { toast.error('Ismingizni kiriting'); return; }
    const cleanPhone = (phone ?? '').replace(/\s/g, '');
    if (cleanPhone.length < 12) { toast.error('Telefon raqamingizni to\'liq kiriting'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          serviceId: service?.id,
          date: selectedDate,
          startTime: selectedTime,
          notes: notes.trim() || undefined,
          addons: selectedAddons,
        }),
      });
      if (res.status === 409) {
        toast.error('Bu vaqt band qilingan. Iltimos, boshqa vaqtni tanlang.');
        setStep(1);
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        toast.error('Xatolik yuz berdi. Qayta urinib ko\'ring.');
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setBookingResult(data);
      setStep(3);
    } catch {
      toast.error('Tarmoq xatosi');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return { dayName: '', dateNum: 1, month: '' };
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(d);
    target.setHours(0,0,0,0);
    
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

    if (diffDays === 0) return { dayName: 'Bugun', dateNum: d.getDate(), month: months[d.getMonth()] };
    if (diffDays === 1) return { dayName: 'Ertaga', dateNum: d.getDate(), month: months[d.getMonth()] };
    return { dayName: days[d.getDay()], dateNum: d.getDate(), month: months[d.getMonth()] };
  };

  const formatPhoneInput = (val: string) => {
    let digits = val.replace(/\D/g, '');
    if (!digits.startsWith('998')) digits = '998' + digits;
    let formatted = '+998 ';
    const rest = digits.slice(3);
    if (rest.length > 0) formatted += rest.slice(0, 2);
    if (rest.length > 2) formatted += ' ' + rest.slice(2, 5);
    if (rest.length > 5) formatted += ' ' + rest.slice(5, 7);
    if (rest.length > 7) formatted += ' ' + rest.slice(7, 9);
    return formatted;
  };

  const generateGoogleCalendarUrl = () => {
    if (!bookingResult || !selectedDate || !selectedTime) return '#';
    const cleanDate = selectedDate.replace(/-/g, '');
    const cleanStart = selectedTime.replace(':', '') + '00';
    const endHour = (bookingResult.endTime || selectedTime).replace(':', '') + '00';
    const title = encodeURIComponent(`${service?.name ?? 'Barber Bron'} — ${settings?.barberName ?? 'Jasurbek Barber'}`);
    const details = encodeURIComponent(`Sartaroshxonaga tashrif. Xizmat: ${service?.name ?? ''}. Narx: ${(bookingResult?.price ?? totalPrice).toLocaleString()} so'm.`);
    const location = encodeURIComponent(settings?.address ?? "Farg'ona shahar");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}T${cleanStart}/${cleanDate}T${endHour}&details=${details}&location=${location}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e: any) => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col border border-white/10 shadow-2xl overflow-hidden"
        style={{ backgroundColor: th.surface }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/20">
          <div className="flex items-center gap-3">
            {step > 0 && step < 3 && (
              <button 
                onClick={() => setStep(step - 1)} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-stone-300"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <p className="text-[10px] font-semibold tracking-wider uppercase text-stone-400">
                Qadam {step + 1} / {STEPS.length}
              </p>
              <h3 className="font-semibold text-base text-white">{STEPS[step]}</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-stone-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Minimal Progress Indicator */}
        <div className="flex gap-1.5 px-6 pt-3 pb-1">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className="flex-1 h-1 rounded-full transition-all duration-300" 
              style={{ 
                backgroundColor: i <= step ? th.primary : 'rgba(255,255,255,0.08)',
              }} 
            />
          ))}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* STEP 0: Service Selection + VIP Add-ons */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs text-stone-400 font-medium block mb-2.5">
                  1. Asosiy xizmat turini tanlang:
                </label>
                <div className="space-y-2">
                  {services.map(s => {
                    const isSelected = service?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setService(s)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? 'border-white/30 bg-white/[0.06] shadow-sm' 
                            : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                            style={{ 
                              backgroundColor: isSelected ? th.badgeBg : 'rgba(255,255,255,0.03)',
                              color: isSelected ? th.primary : '#a8a29e'
                            }}
                          >
                            <Scissors size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-white">{s.name}</p>
                            <span className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                              <Clock size={11} /> {s.duration} daqiqa
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-white tabular-nums">
                            {s.price.toLocaleString('uz-UZ')} <span className="text-xs text-stone-400 font-normal">so&apos;m</span>
                          </p>
                          {isSelected && (
                            <span className="text-[10px] font-medium" style={{ color: th.primary }}>
                              Tanlangan ✓
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VIP Addons Block */}
              {service && (
                <div className="pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Sparkles size={14} style={{ color: th.primary }} />
                    <span className="text-xs font-semibold text-white">VIP Qo&apos;shimcha xizmatlar (ixtiyoriy)</span>
                  </div>
                  <div className="space-y-2">
                    {VIP_ADDONS.map(addon => {
                      const isChecked = selectedAddons.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(addon.id)}
                          className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isChecked 
                              ? 'border-white/20 bg-white/[0.05]' 
                              : 'border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                isChecked ? 'text-[#121316]' : 'border-white/20'
                              }`}
                              style={isChecked ? { backgroundColor: th.primary, borderColor: th.primary } : {}}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white">{addon.name}</p>
                              <p className="text-[11px] text-stone-400">{addon.desc} (+{addon.duration} min)</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold tabular-nums shrink-0 ml-2" style={{ color: th.primary }}>
                            +{addon.price.toLocaleString('uz-UZ')} so&apos;m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Next Step Action Button */}
              {service && (
                <button
                  onClick={() => setStep(1)}
                  className="w-full mt-4 py-3.5 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99]"
                  style={{ backgroundColor: th.primary, color: '#121316' }}
                >
                  <span>Sana & Vaqtni tanlash ({totalDuration} daqiqa • {totalPrice.toLocaleString('uz-UZ')} so&apos;m)</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* STEP 1: Date & Time Slot Selection */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Service Summary Strip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Scissors size={14} style={{ color: th.primary }} />
                  <span className="font-semibold text-xs text-white">{service?.name}</span>
                  {selectedAddons.length > 0 && (
                    <span className="text-[11px] text-stone-400">(+{selectedAddons.length} qo&apos;shimcha)</span>
                  )}
                </div>
                <button 
                  onClick={() => setStep(0)} 
                  className="text-xs text-stone-400 hover:text-white underline underline-offset-2"
                >
                  O&apos;zgartirish
                </button>
              </div>

              {/* Date Selection */}
              <div>
                <span className="text-xs font-semibold text-stone-300 block mb-2.5">
                  1. Qabul kunini tanlang:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                  {dates.map(dStr => {
                    const info = formatDateLabel(dStr);
                    const isSelected = selectedDate === dStr;
                    return (
                      <button
                        key={dStr}
                        onClick={() => { setSelectedDate(dStr); setSelectedTime(''); }}
                        className={`shrink-0 w-16 py-3 rounded-xl flex flex-col items-center justify-center border transition-all snap-start ${
                          isSelected 
                            ? 'shadow-md scale-102 border-transparent' 
                            : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] text-stone-300'
                        }`}
                        style={isSelected ? { 
                          backgroundColor: th.primary, 
                          color: '#121316',
                        } : {}}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85">{info.dayName}</span>
                        <span className="text-lg font-bold my-0.5 tabular-nums">{info.dateNum}</span>
                        <span className="text-[10px] opacity-75">{info.month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <span className="text-xs font-semibold text-stone-300 block mb-2.5">
                  2. Bo&apos;sh vaqtni tanlang:
                </span>

                {loadingSlots ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" style={{ borderTopColor: th.primary }} />
                    <span className="text-xs text-stone-400">Jadval tekshirilmoqda...</span>
                  </div>
                ) : (availableSlots?.length ?? 0) === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <Clock size={24} className="mx-auto mb-2 text-stone-500" />
                    <p className="text-sm font-semibold text-stone-300">Bu kunda bo&apos;sh vaqt qolmadi</p>
                    <p className="text-xs text-stone-400 mt-1">Iltimos, yuqoridagi sanalardan boshqa kunni tanlang.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedSlots.morning.length > 0 && (
                      <div>
                        <div className="text-[11px] font-medium text-stone-400 mb-2">
                          Ertalab (09:00 - 12:00)
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {groupedSlots.morning.map(slot => (
                            <SlotButton 
                              key={slot} 
                              slot={slot} 
                              isSelected={selectedTime === slot} 
                              theme={th} 
                              onSelect={() => setSelectedTime(slot)} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedSlots.afternoon.length > 0 && (
                      <div>
                        <div className="text-[11px] font-medium text-stone-400 mb-2">
                          Tushdan keyin (12:00 - 17:00)
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {groupedSlots.afternoon.map(slot => (
                            <SlotButton 
                              key={slot} 
                              slot={slot} 
                              isSelected={selectedTime === slot} 
                              theme={th} 
                              onSelect={() => setSelectedTime(slot)} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedSlots.evening.length > 0 && (
                      <div>
                        <div className="text-[11px] font-medium text-stone-400 mb-2">
                          Kechqurun (17:00 - 20:30)
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {groupedSlots.evening.map(slot => (
                            <SlotButton 
                              key={slot} 
                              slot={slot} 
                              isSelected={selectedTime === slot} 
                              theme={th} 
                              onSelect={() => setSelectedTime(slot)} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedTime && (
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 rounded-xl font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99]"
                  style={{ backgroundColor: th.primary, color: '#121316' }}
                >
                  <span>Davom etish ({selectedTime})</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* STEP 2: Customer Contact Details */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs text-stone-300 font-medium mb-1.5 block">
                    Ismingiz *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ism Familiya"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] rounded-xl border border-white/10 focus:outline-none focus:border-stone-400 text-sm text-white placeholder:text-stone-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-300 font-medium mb-1.5 block">
                    Telefon raqamingiz *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(formatPhoneInput(e.target.value))}
                      placeholder="+998 90 123 45 67"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] rounded-xl border border-white/10 focus:outline-none focus:border-stone-400 text-sm tabular-nums text-white placeholder:text-stone-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-400 mb-1.5 block">
                    Maxsus istaklar (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Masalan: Soch o'rtacha uzunlikda qolsin"
                    className="w-full px-4 py-2 bg-white/[0.04] rounded-xl border border-white/10 focus:outline-none focus:border-stone-400 text-xs text-white placeholder:text-stone-500 transition-colors"
                  />
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.08] space-y-2 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Asosiy xizmat:</span>
                  <span className="text-white font-medium">{service?.name}</span>
                </div>
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between text-stone-400">
                    <span>Qo&apos;shimchalar:</span>
                    <span className="text-white font-medium">+{selectedAddons.length} ta xizmat</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400">
                  <span>Sana & Vaqt:</span>
                  <span className="text-white font-medium">{selectedDate} • {selectedTime}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Taxminiy davomiylik:</span>
                  <span className="text-white font-medium">{totalDuration} daqiqa</span>
                </div>
                <div className="pt-2 border-t border-white/[0.08] flex justify-between items-center">
                  <span className="font-semibold text-sm text-white">Jami to&apos;lov:</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: th.primary }}>
                    {totalPrice.toLocaleString('uz-UZ')} so&apos;m
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full py-3.5 rounded-xl font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
                style={{ backgroundColor: th.primary, color: '#121316' }}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={15} />
                    <span>Bronni tasdiqlash</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: Elegant VIP Confirmation */}
          {step === 3 && (
            <div className="space-y-5 py-2">
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border"
                  style={{ 
                    backgroundColor: th.badgeBg, 
                    color: th.primary,
                    borderColor: th.badgeBorder 
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Bron tasdiqlandi</h3>
                <p className="text-xs text-stone-400 mt-1">Siz uchun maxsus vaqt ajratildi. Kutib qolamiz!</p>
              </div>

              {/* Clean Confirmation Card */}
              <div className="rounded-xl p-5 border border-white/10 bg-black/40 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-500">Salon</span>
                    <p className="font-semibold text-sm text-white">{settings?.businessName ?? 'Jasurbek Barber'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500">Holat</span>
                    <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Tasdiqlangan
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase">Xizmat</span>
                    <p className="font-medium text-white mt-0.5">{bookingResult?.service ?? service?.name}</p>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase">Sana</span>
                    <p className="font-medium text-white mt-0.5">{bookingResult?.date ?? selectedDate}</p>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase">Vaqt</span>
                    <p className="text-sm font-semibold tabular-nums mt-0.5" style={{ color: th.primary }}>
                      {bookingResult?.startTime ?? selectedTime} — {bookingResult?.endTime ?? ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase">To&apos;lov</span>
                    <p className="text-sm font-semibold text-white tabular-nums mt-0.5">
                      {(bookingResult?.price ?? totalPrice).toLocaleString('uz-UZ')} so&apos;m
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] text-[11px] text-stone-400 flex items-center gap-1.5">
                  <User size={13} className="text-stone-500" />
                  <span>Mijoz: {bookingResult?.customer ?? name} • {phone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <a
                  href={generateGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Calendar size={14} style={{ color: th.primary }} />
                  <span>Google Calendar-ga qo&apos;shish</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-semibold text-xs tracking-wide transition-all"
                  style={{ backgroundColor: th.primary, color: '#121316' }}
                >
                  Tayyor
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SlotButton({ slot, isSelected, theme, onSelect }: { slot: string; isSelected: boolean; theme: LuxuryTheme; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`py-2 px-1 text-xs rounded-lg font-semibold tabular-nums border transition-all text-center ${
        isSelected 
          ? 'shadow-sm' 
          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-stone-300'
      }`}
      style={isSelected ? { 
        backgroundColor: theme.primary, 
        color: '#121316',
        borderColor: theme.primary 
      } : {}}
    >
      {slot}
    </button>
  );
}
