'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Check, Clock, Scissors, 
  Calendar, User, Phone, Send, MapPin, Copy, Sparkles,
  Sun, Sunset, Moon, ExternalLink, ShieldCheck, Plus, CheckCircle2
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

const STEPS = ['Xizmat', 'Sana & Vaqt', "Ma'lumotlar", 'Chipta'];

const VIP_ADDONS = [
  { id: 'massage', name: 'Bosh & Yuz massaji', price: 40000, duration: 15, desc: 'Issiq sochiq va efir moylari bilan relaks' },
  { id: 'styling', name: 'Premium soch yuvish & styling', price: 25000, duration: 10, desc: 'Import vositalar va fen yordamida shakllantirish' },
  { id: 'mask', name: 'Qora qora niqob (Black mask)', price: 35000, duration: 15, desc: 'Yuz terisini tozalash va parvarishlash' },
];

export default function BookingModal({ services, selectedService, accentColor, theme, settings, onClose }: Props) {
  const th = theme || getTheme(settings?.themePreset, accentColor);
  const [step, setStep] = useState(selectedService ? 1 : 0);
  const [service, setService] = useState<ServiceType | null>(selectedService);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [notes, setNotes] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Generate 30 days ahead
  const dates = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      list.push(d.toISOString().split('T')[0] ?? '');
    }
    return list;
  }, []);

  // Pre-select today on first open
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

  const selectService = (s: ServiceType) => {
    setService(s);
    setStep(1);
  };

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

  // Total price calculation
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
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e: any) => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col border border-white/10 shadow-2xl overflow-hidden"
        style={{ backgroundColor: th.surface }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/20">
          <div className="flex items-center gap-3">
            {step > 0 && step < 3 && (
              <button 
                onClick={() => setStep(step - 1)} 
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-stone-300"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: th.primary }}>
                Qadam {step + 1} / {STEPS.length}
              </p>
              <h3 className="font-bold text-base text-white">{STEPS[step]}</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-stone-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Halos */}
        <div className="flex gap-1.5 px-6 pt-3 pb-1">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className="flex-1 h-1 rounded-full transition-all duration-300" 
              style={{ 
                backgroundColor: i <= step ? th.primary : 'rgba(255,255,255,0.08)',
                boxShadow: i === step ? `0 0 10px ${th.glow}` : 'none'
              }} 
            />
          ))}
        </div>

        {/* Dynamic Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          
          {/* STEP 0: Select Service */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-stone-400 mb-2">Kerakli xizmat turini tanlang:</p>
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectService(s)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/[0.08] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{ 
                        backgroundColor: th.badgeBg, 
                        borderColor: th.border,
                        color: th.primary 
                      }}
                    >
                      <Scissors size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white group-hover:text-amber-200 transition-colors">
                        {s.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                        <span className="flex items-center gap-1"><Clock size={11} /> {s.duration} daqiqa</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-extrabold" style={{ color: th.primary }}>
                      {s.price.toLocaleString('uz-UZ')} so&apos;m
                    </p>
                    <span className="text-[11px] text-stone-500 group-hover:text-stone-300 transition-colors">Tanlash →</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 1: Luxury Date & Grouped Time Picker */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Selected service pill summary */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Scissors size={15} style={{ color: th.primary }} />
                  <span className="font-semibold text-xs text-white">{service?.name}</span>
                </div>
                <button 
                  onClick={() => setStep(0)} 
                  className="text-xs underline text-stone-400 hover:text-white"
                >
                  O&apos;zgartirish
                </button>
              </div>

              {/* Horizontal Date Ribbon */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-stone-300">1. Sanani tanlang:</span>
                  <span className="text-[11px] text-stone-400">Gorizontal suring →</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                  {dates.map((d) => {
                    const info = formatDateLabel(d);
                    const isSelected = selectedDate === d;
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedTime('');
                        }}
                        className={`shrink-0 w-16 py-3 rounded-2xl flex flex-col items-center justify-center border transition-all snap-start ${
                          isSelected
                            ? 'border-2 shadow-lg scale-105'
                            : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-stone-300'
                        }`}
                        style={isSelected ? { 
                          backgroundColor: th.primary, 
                          color: '#0B0C10',
                          borderColor: th.primary,
                          boxShadow: `0 0 16px ${th.glow}` 
                        } : {}}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{info.dayName}</span>
                        <span className="text-xl font-extrabold my-0.5">{info.dateNum}</span>
                        <span className="text-[10px] opacity-75">{info.month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots (Grouped by Morning / Afternoon / Evening) */}
              <div>
                <span className="text-xs font-semibold text-stone-300 block mb-2.5">2. Bo&apos;sh vaqtni tanlang:</span>
                
                {loadingSlots ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: th.primary, borderTopColor: 'transparent' }} />
                    <span className="text-xs text-stone-400">Jadval tekshirilmoqda...</span>
                  </div>
                ) : (availableSlots?.length ?? 0) === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <Clock size={28} className="mx-auto mb-2 text-stone-500" />
                    <p className="text-sm font-semibold text-stone-300">Bu kunda bo&apos;sh vaqt qolmadi</p>
                    <p className="text-xs text-stone-400 mt-1">Iltimos, yuqoridagi sanalardan boshqa kunni tanlang.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Morning */}
                    {groupedSlots.morning.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-2">
                          <Sun size={13} className="text-amber-400" />
                          <span>Ertalab (09:00 - 12:00)</span>
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

                    {/* Afternoon */}
                    {groupedSlots.afternoon.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-2">
                          <Sunset size={13} className="text-orange-400" />
                          <span>Tushdan keyin (12:00 - 17:00)</span>
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

                    {/* Evening */}
                    {groupedSlots.evening.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-2">
                          <Moon size={13} className="text-blue-400" />
                          <span>Kechqurun (17:00 - 20:30)</span>
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

              {/* Next Step Button */}
              {selectedTime && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setStep(2)}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg"
                  style={{ backgroundColor: th.primary, color: '#0B0C10', boxShadow: `0 4px 20px ${th.glow}` }}
                >
                  <span>Davom etish ({selectedTime})</span>
                  <ArrowRight size={15} />
                </motion.button>
              )}
            </div>
          )}

          {/* STEP 2: Customer Details & VIP Add-ons */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Contact Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs text-stone-300 font-semibold mb-1.5 block">Ismingiz *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ism Familiya"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.04] rounded-xl border border-white/10 focus:outline-none text-sm text-white placeholder:text-stone-500 transition-colors"
                      style={{ borderColor: name ? th.borderActive : undefined }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-300 font-semibold mb-1.5 block">Telefon raqamingiz *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                      placeholder="+998 90 123 45 67"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.04] rounded-xl border border-white/10 focus:outline-none text-sm font-mono text-white placeholder:text-stone-500 transition-colors"
                      style={{ borderColor: phone.length >= 17 ? th.borderActive : undefined }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-400 mb-1.5 block">Maxsus istaklar (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masalan: Soch o'rtacha uzunlikda qolsin"
                    className="w-full px-4 py-2.5 bg-white/[0.04] rounded-xl border border-white/10 focus:outline-none text-xs text-white placeholder:text-stone-500 transition-colors"
                  />
                </div>
              </div>

              {/* VIP Add-on Upsells */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles size={14} style={{ color: th.primary }} />
                  <span className="text-xs font-bold text-white">VIP Qo&apos;shimcha xizmatlar</span>
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
                            ? 'border-2 bg-white/[0.06]' 
                            : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                        style={isChecked ? { borderColor: th.primary } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                              isChecked ? 'text-black' : 'border-white/20'
                            }`}
                            style={isChecked ? { backgroundColor: th.primary, borderColor: th.primary } : {}}
                          >
                            {isChecked && <Check size={13} strokeWidth={3} />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{addon.name}</p>
                            <p className="text-[11px] text-stone-400">{addon.desc}</p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold shrink-0 ml-2" style={{ color: th.primary }}>
                          +{addon.price.toLocaleString('uz-UZ')} so&apos;m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Executive Order Summary Card */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Asosiy xizmat:</span>
                  <span className="text-white font-medium">{service?.name}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Sana & Vaqt:</span>
                  <span className="text-white font-medium">{selectedDate} • {selectedTime}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Taxminiy davomiylik:</span>
                  <span className="text-white font-medium">{totalDuration} daqiqa</span>
                </div>
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between text-stone-400">
                    <span>Qo&apos;shimchalar:</span>
                    <span className="text-white font-medium">+{selectedAddons.length} ta xizmat</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="font-bold text-sm text-white">Jami to&apos;lov (joyida):</span>
                  <span className="font-mono text-base font-extrabold" style={{ color: th.primary }}>
                    {totalPrice.toLocaleString('uz-UZ')} so&apos;m
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 transition-all"
                style={{ 
                  backgroundColor: th.primary, 
                  color: '#0B0C10',
                  boxShadow: `0 4px 25px ${th.glow}` 
                }}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Bronni Tasdiqlash</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: Digital Boarding Pass Ticket Confirmation */}
          {step === 3 && bookingResult && (
            <div className="space-y-5 py-2">
              <div className="text-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                  style={{ backgroundColor: th.badgeBg, color: th.primary, boxShadow: `0 0 20px ${th.glow}` }}
                >
                  <Check size={28} strokeWidth={3} />
                </div>
                <h3 className="text-xl font-extrabold text-white">Bron muvaffaqiyatli band qilindi!</h3>
                <p className="text-xs text-stone-400 mt-1">Siz uchun maxsus vaqt ajratildi. Kutib qolamiz!</p>
              </div>

              {/* Luxury Boarding Pass Ticket Card */}
              <div className="relative rounded-2xl p-5 border border-white/15 bg-black/60 shadow-2xl overflow-hidden">
                {/* Perforated border decoration */}
                <div className="flex items-center justify-between pb-3 border-b border-dashed border-white/20 mb-3">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">Salon</span>
                    <p className="font-bold text-sm text-white">{settings?.businessName ?? 'Jasurbek Barber'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">Holat</span>
                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Tasdiqlangan
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 text-xs">
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase">Xizmat</span>
                    <p className="font-semibold text-white mt-0.5">{bookingResult?.service ?? service?.name}</p>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase">Sana</span>
                    <p className="font-semibold text-white mt-0.5">{bookingResult?.date ?? selectedDate}</p>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase">Vaqt</span>
                    <p className="font-mono text-sm font-bold text-amber-200 mt-0.5" style={{ color: th.primary }}>
                      {bookingResult?.startTime ?? selectedTime} — {bookingResult?.endTime ?? ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase">To&apos;lov</span>
                    <p className="font-mono text-sm font-bold text-white mt-0.5">
                      {(bookingResult?.price ?? totalPrice).toLocaleString('uz-UZ')} so&apos;m
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-stone-400">
                  <MapPin size={13} style={{ color: th.primary }} />
                  <span className="truncate">{settings?.address ?? "Farg'ona shahar"}</span>
                </div>
              </div>

              {/* Action Buttons: Calendar, Telegram, Maps */}
              <div className="space-y-2.5">
                {/* Google Calendar Link */}
                <a
                  href={generateGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-white transition-colors"
                >
                  <Calendar size={15} style={{ color: th.primary }} />
                  <span>Google Calendar-ga qo&apos;shish</span>
                  <ExternalLink size={12} className="opacity-50" />
                </a>

                {/* Telegram Bot Link */}
                {bookingResult?.telegramLink && (
                  <a
                    href={bookingResult.telegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-[#0088cc]/20 hover:bg-[#0088cc]/30 border border-[#0088cc]/30 text-sky-200 transition-colors"
                  >
                    <Send size={15} className="text-[#0088cc]" />
                    <span>Telegram botda eslatma yoqish</span>
                  </a>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-stone-300 transition-colors"
                >
                  Yopish
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
      onClick={onSelect}
      className={`py-2.5 rounded-xl font-mono text-xs font-bold border transition-all ${
        isSelected
          ? 'scale-105 shadow-md font-extrabold'
          : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.08] text-stone-300'
      }`}
      style={isSelected ? { 
        backgroundColor: theme.primary, 
        color: '#0B0C10',
        borderColor: theme.primary,
        boxShadow: `0 0 12px ${theme.glow}` 
      } : {}}
    >
      {slot}
    </button>
  );
}

function ArrowRight({ size = 16 }: { size?: number }) {
  return <ChevronRight size={size} />;
}
