export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendTelegramMessage, sendBarberNotification } from '@/lib/telegram';
import { timeToMinutes, minutesToTime, tashkentNow, getAvailableSlots } from '@/lib/availability';
import { findOrCreateCustomer, canonicalPhone } from '@/lib/customer';

const VIP_ADDONS_MAP: Record<string, { name: string; price: number; duration: number }> = {
  massage: { name: 'Bosh & Yuz massaji', price: 40000, duration: 15 },
  styling: { name: 'Premium soch yuvish & styling', price: 25000, duration: 10 },
  mask: { name: 'Qora qora niqob (Black mask)', price: 35000, duration: 15 },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, serviceId, date, startTime, notes, addons } = body ?? {};
    if (!name?.trim() || !phone || !serviceId || !date || !startTime) {
      return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 });
    }

    // Phone format validation (Uzbekistan mobile)
    const canon = canonicalPhone(phone);
    if (!/^\+998\d{9}$/.test(canon)) {
      return NextResponse.json({ error: 'Telefon raqam noto\'g\'ri. Masalan: +998 90 123 45 67' }, { status: 400 });
    }

    // Date & Time format and past-time validation (Tashkent UTC+5)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Sana formati noto\'g\'ri' }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      return NextResponse.json({ error: 'Vaqt formati noto\'g\'ri' }, { status: 400 });
    }

    const now = tashkentNow();
    if (date < now.date) {
      return NextResponse.json({ error: 'O\'tgan kunga bron qilib bo\'lmaydi' }, { status: 400 });
    }

    const startMin = timeToMinutes(startTime);
    if (date === now.date && startMin <= now.minutes) {
      return NextResponse.json({ error: 'Bu vaqt o\'tib ketgan. Kelgusi vaqtni tanlang.' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) {
      return NextResponse.json({ error: 'Xizmat topilmadi' }, { status: 404 });
    }

    // Check slot is open according to schedule, day off, and breaks
    const availableSlots = await getAvailableSlots(date, service.duration);
    if (!availableSlots.includes(startTime)) {
      return NextResponse.json({ error: 'Bu vaqt mavjud emas yoki band qilingan' }, { status: 409 });
    }

    // Process VIP add-ons and notes
    let extraPrice = 0;
    const addonNames: string[] = [];
    if (Array.isArray(addons)) {
      for (const aId of addons) {
        const item = VIP_ADDONS_MAP[aId];
        if (item) {
          extraPrice += item.price;
          addonNames.push(item.name);
        }
      }
    }
    const finalPrice = service.price + extraPrice;
    const noteParts: string[] = [];
    if (notes && typeof notes === 'string' && notes.trim()) noteParts.push(notes.trim());
    if (addonNames.length > 0) noteParts.push(`VIP: ${addonNames.join(', ')}`);
    const finalNotes = noteParts.length > 0 ? noteParts.join(' • ') : null;

    const endTime = minutesToTime(startMin + service.duration);
    const dateObj = new Date(date + 'T00:00:00Z');

    // Double booking check + create in transaction with date-level advisory lock
    const result = await prisma.$transaction(async (tx: any) => {
      // Serialize concurrent booking attempts for the same date
      const dateHash = Math.abs(date.split('-').reduce((acc: number, char: string) => ((acc << 5) - acc) + char.charCodeAt(0), 0));
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${dateHash})`);

      const overlapping = await tx.appointment.findFirst({
        where: {
          date: dateObj,
          status: { notIn: ['cancelled', 'no_show'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (overlapping) {
        throw new Error('SLOT_TAKEN');
      }

      // Find or create customer (dedup by phone / name so visit count accumulates)
      const customer = await findOrCreateCustomer(tx, { name: name.trim(), phone: canon });

      const appointment = await tx.appointment.create({
        data: {
          customerId: customer.id,
          serviceId: service.id,
          date: dateObj,
          startTime,
          endTime,
          price: finalPrice,
          notes: finalNotes,
          status: 'confirmed',
        },
        include: { customer: true, service: true },
      });

      // Create Telegram link token
      const linkToken = await tx.telegramLinkToken.create({
        data: {
          customerId: customer.id,
          appointmentId: appointment.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return { appointment, linkToken, customer };
    });

    // Send Telegram notifications (non-blocking)
    const appt = result.appointment;
    const settings = await prisma.businessSettings.findFirst();
    const barberMsg = `🆕 Yangi bron!\n\n👤 ${appt?.customer?.name}\n📱 ${appt?.customer?.phone}\n✂️ ${appt?.service?.name}\n📅 ${date}\n🕐 ${startTime} - ${endTime}\n💰 ${(appt?.price ?? 0).toLocaleString()} so'm${appt?.notes ? `\n📝 ${appt.notes}` : ''}`;
    sendBarberNotification(barberMsg).catch(() => {});

    if (result.customer?.telegramId) {
      const custMsg = `✅ Bron tasdiqlandi!\n\n✂️ ${appt?.service?.name}\n📅 ${date}\n🕐 ${startTime} - ${endTime}\n💰 ${(appt?.price ?? 0).toLocaleString()} so'm\n📍 ${settings?.address ?? ''}\n\nRahmat! Sizni kutib qolamiz! 🙏`;
      sendTelegramMessage(result.customer.telegramId, custMsg).catch(() => {});
    }

    return NextResponse.json({
      id: appt.id,
      date,
      startTime,
      endTime,
      service: appt?.service?.name,
      price: appt.price,
      status: appt.status,
      telegramLink: `https://t.me/${settings?.telegramUsername ?? 'jasurbek_barber_bot'}?start=${result.linkToken.token}`,
      linkToken: result.linkToken.token,
    }, { status: 201 });
  } catch (e: any) {
    if (e?.message === 'SLOT_TAKEN') {
      return NextResponse.json({ error: 'Bu vaqt band. Boshqa vaqtni tanlang.' }, { status: 409 });
    }
    console.error('Appointment create error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
