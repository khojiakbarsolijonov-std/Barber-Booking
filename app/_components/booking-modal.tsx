'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Clock, Scissors, Calendar, User, Phone, Send, MapPin, Copy } from 'lucide-react';
import { toast } from 'sonner';

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
  settings: any;
  onClose: () => void;
}

const STEPS = ['Xizmat', 'Sana', 'Vaqt', "Ma'lumotlar", 'Tayyor!'];

export default function BookingModal({ services, selectedService, accentColor, settings, onClose }: Props) {
  const [step, setStep] = useState(selectedService ? 1 : 0);
  const [service, setService] = useState<ServiceType | null>(selectedService);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Generate dates (30 days ahead)
  const getDates = useCallback(() => {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0] ?? '');
    }
    return dates;
  }, []);

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

  const selectDate = (d: string) => {
    setSelectedDate(d);
    setSelectedTime('');
    setStep(2);
  };

  const selectTime = (t: string) => {
    setSelectedTime(t);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!name?.trim()) { toast.error('Ismingizni kiriting'); return; }
    const cleanPhone = (phone ?? '').replace(/\s/g, '');
    if (cleanPhone.length < 12) { toast.error('Telefon raqamni kiriting'); return; }
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
        }),
      });
      if (res.status === 409) {
        toast.error('Bu vaqt band. Boshqa vaqtni tanlang.');
        setStep(2);
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        toast.error('Xatolik yuz berdi');
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setBookingResult(data);
      setStep(4);
    } catch {
      toast.error('Tarmoq xatosi');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    return `${days[d.getDay()] ?? ''}, ${d.getDate()} ${months[d.getMonth()] ?? ''}`;
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={(e: any) => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full md:max-w-md bg-zinc-900 rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {step > 0 && step < 4 && (
              <button onClick={() => setStep(step - 1)} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
            <h3 className="font-display font-bold text-lg">{STEPS[step] ?? ''}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-4 pt-3">
          {STEPS.map((_, i: number) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ backgroundColor: i <= step ? accentColor : '#333' }} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {/* Step 0: Service Selection */}
          {step === 0 && (
            <div className="space-y-3">
              {(services ?? []).map((s: ServiceType) => (
                <button
                  key={s?.id}
                  onClick={() => selectService(s)}
                  className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor + '22' }}>
                    <Scissors size={18} style={{ color: accentColor }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{s?.name ?? ''}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <span style={{ color: accentColor }}>{((s?.price ?? 0)).toLocaleString('uz-UZ')} so&apos;m</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {s?.duration ?? 0} daq</span>
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-500" />
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Date Selection */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Qulay sanani tanlang:</p>
              <div className="grid grid-cols-3 gap-2">
                {getDates().map((d: string) => (
                  <button
                    key={d}
                    onClick={() => selectDate(d)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      selectedDate === d
                        ? 'text-black font-bold'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                    style={selectedDate === d ? { backgroundColor: accentColor } : {}}
                  >
                    <p className="text-xs opacity-70">{formatDate(d).split(',')[0]}</p>
                    <p className="text-lg font-bold">{new Date(d + 'T12:00:00').getDate()}</p>
                    <p className="text-xs opacity-70">{formatDate(d).split(' ').slice(1).join(' ')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Time Selection */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-400 mb-1">{service?.name} — {formatDate(selectedDate)}</p>
              <p className="text-xs text-gray-500 mb-4">Qulay vaqtni tanlang:</p>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
                </div>
              ) : (availableSlots?.length ?? 0) === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Bu sana uchun bo&apos;sh joy yo&apos;q</p>
                  <button onClick={() => setStep(1)} className="mt-3 text-sm underline" style={{ color: accentColor }}>Boshqa sana tanlash</button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {(availableSlots ?? []).map((t: string) => (
                    <button
                      key={t}
                      onClick={() => selectTime(t)}
                      className={`py-3 rounded-xl font-mono text-sm font-medium transition-all ${
                        selectedTime === t ? 'text-black' : 'bg-zinc-800 hover:bg-zinc-700'
                      }`}
                      style={selectedTime === t ? { backgroundColor: accentColor } : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Customer Info */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Ismingiz</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e: any) => setName(e?.target?.value ?? '')}
                    placeholder="Ism Familiya"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:outline-none focus:border-[var(--gold)] text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Telefon raqam</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e: any) => setPhone(formatPhoneInput(e?.target?.value ?? ''))}
                    placeholder="+998 90 123 45 67"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:outline-none focus:border-[var(--gold)] text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-zinc-800 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Xizmat</span>
                  <span>{service?.name ?? ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sana</span>
                  <span>{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vaqt</span>
                  <span>{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Davomiylik</span>
                  <span>{service?.duration ?? 0} daqiqa</span>
                </div>
                <hr className="border-zinc-700" />
                <div className="flex justify-between font-bold">
                  <span>Narx</span>
                  <span style={{ color: accentColor }}>{((service?.price ?? 0)).toLocaleString('uz-UZ')} so&apos;m</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-bold text-black flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Check size={18} /> TASDIQLASH</>
                )}
              </button>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && bookingResult && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: accentColor + '22' }}>
                <Check size={32} style={{ color: accentColor }} />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Bron tasdiqlandi!</h3>
              <p className="text-gray-400 text-sm mb-6">Sizni kutib qolamiz ✂️</p>

              <div className="bg-zinc-800 rounded-xl p-4 text-left space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Xizmat</span>
                  <span>{bookingResult?.service ?? ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sana</span>
                  <span>{formatDate(bookingResult?.date ?? '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vaqt</span>
                  <span>{bookingResult?.startTime ?? ''} - {bookingResult?.endTime ?? ''}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Narx</span>
                  <span style={{ color: accentColor }}>{((bookingResult?.price ?? 0)).toLocaleString('uz-UZ')} so&apos;m</span>
                </div>
                <hr className="border-zinc-700" />
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin size={14} />
                  <span>{settings?.address ?? "Farg'ona shahar"}</span>
                </div>
              </div>

              {bookingResult?.telegramLink && (
                <a
                  href={bookingResult.telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 bg-[#0088cc] text-white mb-3 hover:bg-[#0077b3] transition-colors"
                >
                  <Send size={16} /> Telegram orqali eslatma olish
                </a>
              )}

              <button onClick={onClose} className="w-full py-3 rounded-xl bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition-colors">
                Yopish
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
