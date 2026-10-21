'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, MapPin, Phone, Instagram, Clock, ChevronRight, 
  Star, Coffee, ShieldCheck, Calendar, ArrowRight,
  Navigation, Sparkles, Check
} from 'lucide-react';
import Image from 'next/image';
import BookingModal from './booking-modal';
import { getTheme } from '@/lib/themes';

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  imageUrl: string | null;
}

interface Settings {
  businessName: string;
  barberName: string;
  phone: string;
  address: string;
  instagram: string;
  accentColor: string;
  themePreset?: string;
  avatarUrl: string | null;
  telegramUsername: string | null;
}

const SERVICE_IMAGES: Record<number, string> = {
  0: 'https://cdn.abacus.ai/images/7b7d84f0-71d6-4ebe-ad53-76337c80fcea.png',
  1: 'https://cdn.abacus.ai/images/a6fef18a-d253-4096-b17d-8e94abbd4fc0.png',
  2: 'https://cdn.abacus.ai/images/34dd11c9-7b37-4a70-b924-010204035212.png',
  3: 'https://cdn.abacus.ai/images/0acd286d-7bd1-4049-81bd-dd4430d6e1ea.png',
  4: 'https://cdn.abacus.ai/images/cea33312-1444-4a87-9fdf-3fb51e3ade0d.png',
  5: 'https://cdn.abacus.ai/images/327ffd17-c314-4bc8-bfb4-b9d2f5493e30.png',
};

export default function BookingPage() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d ?? [])).catch(() => {});
    fetch('/api/settings').then(r => r.json()).then(d => setSettings(d)).catch(() => {});
  }, []);

  const th = getTheme(settings?.themePreset, settings?.accentColor);

  const openBooking = (service?: ServiceType) => {
    setSelectedService(service ?? null);
    setShowModal(true);
  };

  const filteredServices = services.filter(s => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'hair') return s.name.toLowerCase().includes('soch') && !s.name.toLowerCase().includes('soqol');
    if (activeCategory === 'beard') return s.name.toLowerCase().includes('soqol') && !s.name.toLowerCase().includes('soch +');
    if (activeCategory === 'combo') return s.name.toLowerCase().includes('+') || s.name.toLowerCase().includes('to\'liq') || s.name.toLowerCase().includes('paket');
    return true;
  });

  return (
    <div 
      className="min-h-screen text-stone-100 selection:bg-stone-700 selection:text-white antialiased font-sans"
      style={{ backgroundColor: th.bg }}
    >
      {/* Top Refined Atelier Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#121316]/85 border-b border-white/[0.07] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm tracking-wider border border-white/10"
              style={{ 
                backgroundColor: th.surface, 
                color: th.primary
              }}
            >
              <Scissors size={17} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-semibold text-sm tracking-wide text-white">
                {settings?.businessName ?? 'Jasurbek Barber'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Bugun ochiq • 20:00 gacha</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openBooking()}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all transform hover:brightness-110 active:scale-[0.98]"
              style={{ 
                backgroundColor: th.primary, 
                color: '#121316',
              }}
            >
              <Calendar size={13} />
              <span>Vaqtni tanlash</span>
            </button>
            <a
              href={`tel:${(settings?.phone ?? '+998905618852').replace(/\s/g, '')}`}
              className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-stone-300 transition-colors"
              title="Qo'ng'iroq qilish"
            >
              <Phone size={15} />
            </a>
          </div>
        </div>
      </header>

      {/* Editorial Atelier Hero */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden" style={{ background: th.bgGradient }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-14">
            
            {/* Left Column: Craft & Persona */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 text-center md:text-left"
            >
              {/* Refined Eyebrow */}
              <div 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider mb-5 border"
                style={{ 
                  backgroundColor: th.badgeBg, 
                  color: th.badgeText, 
                  borderColor: th.badgeBorder 
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: th.primary }} />
                <span>Master Barber & Men&apos;s Grooming</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.12]">
                {settings?.barberName ?? 'Jasurbek Xudoyberganov'}
              </h1>

              <p className="text-base sm:text-lg text-stone-300 max-w-xl mb-6 font-normal leading-relaxed">
                Zamonaviy sartaroshlik san&apos;ati, individual soch va soqol shakllantirish hamda xushmuomala premium xizmat.
              </p>

              {/* Social Proof & Rating Strip */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8 text-xs text-stone-300">
                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.07] px-3.5 py-1.5 rounded-full">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                  <span className="font-semibold text-white">4.9</span>
                  <span className="text-stone-400">(480+ mamnun mijozlar)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.07] px-3.5 py-1.5 rounded-full">
                  <ShieldCheck size={14} style={{ color: th.primary }} />
                  <span>100% sterilizatsiya</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3.5">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => openBooking()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-md"
                  style={{ 
                    backgroundColor: th.primary, 
                    color: '#121316',
                  }}
                >
                  <Calendar size={16} />
                  <span>Vaqtni tanlash & Band qilish</span>
                  <ArrowRight size={15} />
                </motion.button>

                <a
                  href="#services"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-medium tracking-wide text-stone-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
                >
                  Xizmatlar menyusi
                </a>
              </div>

              {/* Contact and Location Meta */}
              <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-stone-400">
                <a 
                  href={`https://instagram.com/${(settings?.instagram ?? '@jasur_alijanovich_').replace('@', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Instagram size={14} style={{ color: th.primary }} />
                  <span>{settings?.instagram ?? '@jasur_alijanovich_'}</span>
                </a>
                <span className="text-stone-600">•</span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} style={{ color: th.primary }} />
                  <span>{settings?.address ?? "Farg'ona shahar, Beeline ro'parasi"}</span>
                </span>
              </div>
            </motion.div>

            {/* Right Column: Architectural Barber Portrait */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative shrink-0"
            >
              <div 
                className="relative w-64 h-80 sm:w-72 sm:h-92 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group"
                style={{ backgroundColor: th.surface }}
              >
                <Image
                  src={settings?.avatarUrl ?? '/barber-jasurbek.jpg'}
                  alt={settings?.barberName ?? 'Jasurbek Xudoyberganov'}
                  fill
                  className="object-cover object-top filter contrast-[1.02] group-hover:scale-102 transition-transform duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-transparent to-transparent opacity-80" />
                
                {/* Understated Portrait Plaque */}
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl backdrop-blur-md bg-[#181A20]/80 border border-white/[0.08]">
                  <p className="font-semibold text-sm text-white">{settings?.barberName ?? 'Jasurbek'}</p>
                  <p className="text-[11px] font-normal" style={{ color: th.primary }}>Master Barber</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Atelier Craft Standards Ribbon */}
      <section className="border-y border-white/[0.06] bg-white/[0.015] py-7 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <span className="text-[11px] font-mono tracking-wider text-stone-500 uppercase">Standart 01</span>
            <p className="font-semibold text-xs text-white">Aniq vaqtda qabul</p>
            <p className="text-[11px] text-stone-400">Navbatsiz va kutishlarsiz individual vaqt</p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <span className="text-[11px] font-mono tracking-wider text-stone-500 uppercase">Standart 02</span>
            <p className="font-semibold text-xs text-white">Lounge & Kofe</p>
            <p className="text-[11px] text-stone-400">Bepul espresso va qulay kutish zonasi</p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <span className="text-[11px] font-mono tracking-wider text-stone-500 uppercase">Standart 03</span>
            <p className="font-semibold text-xs text-white">100% Sterillik</p>
            <p className="text-[11px] text-stone-400">Har bir mijoz uchun alohida dezinfeksiya</p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <span className="text-[11px] font-mono tracking-wider text-stone-500 uppercase">Standart 04</span>
            <p className="font-semibold text-xs text-white">Tanlangan brendlar</p>
            <p className="text-[11px] text-stone-400">Import qilingan premium parvarish vositalari</p>
          </div>
        </div>
      </section>

      {/* Services Menu Section */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto" id="services">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: th.primary }}>
            Tanlangan Xizmatlar
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Xizmatlar menyusi
          </h2>
          <p className="text-sm text-stone-400 mt-2">
            Kerakli xizmatni tanlang va bir necha soniyada o&apos;zingizga qulay vaqtni band qiling.
          </p>

          {/* Minimalist Segmented Category Filter Tabs */}
          <div className="flex items-center justify-center gap-1.5 mt-6 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl max-w-md mx-auto">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'hair', label: 'Soch' },
              { id: 'beard', label: 'Soqol' },
              { id: 'combo', label: 'VIP Paketlar' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === tab.id 
                    ? 'bg-white/10 text-white shadow-sm font-semibold' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                style={activeCategory === tab.id ? { color: th.primary } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service, idx) => {
            const isSignature = service.name.toLowerCase().includes('soch + soqol') || service.name.toLowerCase().includes('to\'liq');
            return (
              <motion.div
                key={service.id ?? idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 group hover:border-white/20 ${
                  isSignature 
                    ? 'border-white/15 shadow-xl' 
                    : 'border-white/[0.07]'
                }`}
                style={{ backgroundColor: th.surface }}
              >
                {/* Tasteful Signature Badge */}
                {isSignature && (
                  <div 
                    className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border shadow-md"
                    style={{ 
                      backgroundColor: th.badgeBg, 
                      color: th.badgeText, 
                      borderColor: th.badgeBorder 
                    }}
                  >
                    Tavsiya etiladi
                  </div>
                )}

                {/* Service Image with subtle vignette */}
                <div className="relative aspect-[16/10] bg-stone-900 overflow-hidden">
                  <Image
                    src={service.imageUrl ?? SERVICE_IMAGES[idx] ?? SERVICE_IMAGES[0]}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181A20] via-transparent to-transparent opacity-90" />
                  
                  {/* Duration Tag */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md backdrop-blur-md bg-black/60 border border-white/10 text-xs text-stone-200">
                    <Clock size={12} style={{ color: th.primary }} />
                    <span>{service.duration} daqiqa</span>
                  </div>
                </div>

                {/* Content Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-white mb-1.5 group-hover:text-stone-100 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed mb-4">
                      {service.description ?? "Professional darajadagi soch yoki soqol shakllantirish, issiq sochiq va individual styling bilan."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Narxi</p>
                      <p className="text-lg font-semibold text-white tracking-tight tabular-nums">
                        <span style={{ color: th.primary }}>{service.price.toLocaleString('uz-UZ')}</span>
                        <span className="text-xs text-stone-400 font-normal ml-1">so&apos;m</span>
                      </p>
                    </div>

                    <button
                      onClick={() => openBooking(service)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 hover:brightness-110 active:scale-95"
                      style={{ 
                        backgroundColor: th.primary, 
                        color: '#121316' 
                      }}
                    >
                      <span>Tanlash</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Location & Working Schedule Card */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <div 
          className="rounded-2xl p-6 sm:p-8 border border-white/[0.08] relative overflow-hidden backdrop-blur-xl"
          style={{ backgroundColor: th.surface }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: th.primary }}>
                Joylashuv va Ish Jadvali
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {settings?.businessName ?? 'Jasurbek Barber'}
              </h3>
              <p className="text-sm text-stone-300 flex items-center gap-2 mb-2">
                <MapPin size={15} style={{ color: th.primary }} />
                <span>{settings?.address ?? "Farg'ona shahar, Beeline ofisi ro'parasida"}</span>
              </p>
              <p className="text-xs text-stone-400 flex items-center gap-2">
                <Clock size={14} style={{ color: th.primary }} />
                <span>Dushanba — Yakshanba: 09:00 dan 20:00 gacha</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <a
                href={`https://yandex.com/maps/?text=${encodeURIComponent(settings?.address ?? "Farg'ona shahar")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white transition-colors"
              >
                <Navigation size={14} style={{ color: th.primary }} />
                <span>Yandex Xaritada ko&apos;rish</span>
              </a>
              <button
                onClick={() => openBooking()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all"
                style={{ backgroundColor: th.primary, color: '#121316' }}
              >
                <Calendar size={14} />
                <span>Navbat olish</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Understated Minimalist Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-4 text-center text-xs text-stone-400">
        <p className="mb-1 text-stone-300 font-medium">{settings?.businessName ?? 'Jasurbek Barber'}</p>
        <p className="text-stone-400">Farg&apos;ona shahar • Barcha huquqlar himoyalangan</p>
      </footer>

      {/* Sticky Mobile Floating Booking Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-[#121316]/90 backdrop-blur-xl border-t border-white/[0.08]">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <p className="text-xs font-semibold text-white">{settings?.barberName ?? 'Jasurbek'}</p>
            <p className="text-[11px] text-stone-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Bo&apos;sh vaqtlar mavjud</span>
            </p>
          </div>
          <button
            onClick={() => openBooking()}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide shadow-md flex items-center gap-1.5"
            style={{ 
              backgroundColor: th.primary, 
              color: '#121316'
            }}
          >
            <Calendar size={13} />
            <span>Bron qilish</span>
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showModal && (
          <BookingModal
            services={services}
            selectedService={selectedService}
            accentColor={th.primary}
            theme={th}
            settings={settings}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
