'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, MapPin, Phone, Instagram, Clock, ChevronRight, Send, Star, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import BookingModal from './booking-modal';

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

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d ?? [])).catch(() => {});
    fetch('/api/settings').then(r => r.json()).then(d => setSettings(d)).catch(() => {});
  }, []);

  const accent = settings?.accentColor ?? '#C8A97E';

  const openBooking = (service?: ServiceType) => {
    setSelectedService(service ?? null);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-[82vh] flex flex-col items-center justify-center px-4 pt-10 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.stockcake.com/public/e/6/7/e6792723-f3c2-4b2a-a3c0-69f669f7b6e3/artisan-beard-grooming-stockcake.jpg"
            alt="Jasurbek Barber professional grooming"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-lg mx-auto"
        >
          {/* Avatar */}
          <div className="relative w-32 h-32 mx-auto mb-6 rounded-full border-2 overflow-hidden bg-zinc-900" style={{ borderColor: accent }}>
            <Image
              src={settings?.avatarUrl ?? '/barber-jasurbek.jpg'}
              alt={settings?.barberName ?? 'Jasurbek Xudoyberganov'}
              fill
              className="object-cover object-top"
              priority
            />
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            {settings?.barberName ?? 'Jasurbek Xudoyberganov'}
          </h1>
          <p className="text-lg mb-4" style={{ color: accent }}>
            Professional Barber | Farg&apos;ona
          </p>

          <div className="flex flex-col gap-2 text-sm text-gray-400 mb-8">
            <a href={`https://instagram.com/${(settings?.instagram ?? '@jasur_alijanovich_').replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 hover:text-white transition-colors">
              <Instagram size={16} /> {settings?.instagram ?? '@jasur_alijanovich_'}
            </a>
            <a href={`tel:${(settings?.phone ?? '+998 90 561 88 52').replace(/\s/g, '')}`} className="flex items-center justify-center gap-2 hover:text-white transition-colors">
              <Phone size={16} /> <span suppressHydrationWarning>{settings?.phone ?? '+998 90 561 88 52'}</span>
            </a>
            <p className="flex items-center justify-center gap-2">
              <MapPin size={16} /> {settings?.address ?? "Farg'ona shahar, Beeline ofisi ro'parasida"}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openBooking()}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-black font-bold text-lg transition-all"
            style={{ backgroundColor: accent }}
          >
            <Scissors size={20} /> BRON QILISH
          </motion.button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.a
          href="#services"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-6 z-10 flex flex-col items-center gap-1"
        >
          <span className="text-xs uppercase tracking-widest text-gray-400">Xizmatlar</span>
          <ChevronRight size={24} className="rotate-90 text-gray-500" />
        </motion.a>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 max-w-5xl mx-auto" id="services">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-2xl md:text-3xl font-bold text-center mb-10 tracking-tight"
        >
          Xizmatlar
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(services ?? []).map((service: ServiceType, idx: number) => (
            <motion.div
              key={service?.id ?? idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => openBooking(service)}
              className="cursor-pointer bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all group"
            >
              <div className="relative aspect-[4/3] bg-zinc-800">
                <Image
                  src={service?.imageUrl ?? SERVICE_IMAGES[idx] ?? SERVICE_IMAGES[0]}
                  alt={service?.name ?? 'Xizmat'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm md:text-base mb-1">{service?.name ?? ''}</h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span style={{ color: accent }}>{((service?.price ?? 0)).toLocaleString('uz-UZ')} so&apos;m</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {service?.duration ?? 0} daq</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-4 border-t border-zinc-800">
        <div className="max-w-md mx-auto text-center text-sm text-gray-500">
          <p className="mb-2">✂️ {settings?.businessName ?? 'Jasurbek Barber'}</p>
          <p>{settings?.address ?? "Farg'ona shahar, Beeline ofisi ro'parasida"}</p>
        </div>
      </section>

      {/* Booking Modal */}
      <AnimatePresence>
        {showModal && (
          <BookingModal
            services={services}
            selectedService={selectedService}
            accentColor={accent}
            settings={settings}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
