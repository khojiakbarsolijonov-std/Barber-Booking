export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendTelegramMessage, sendBarberNotification } from '@/lib/telegram';
import { timeToMinutes, minutesToTime } from '@/lib/availability';
import { findOrCreateCustomer } from '@/lib/customer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, serviceId, date, startTime } = body ?? {};
    if (!name || !phone || !serviceId || !date || !startTime) {
      return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 });
    }
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Xizmat topilmadi' }, { status: 404 });
    }
    const startMin = timeToMinutes(startTime);
    const endTime = minutesToTime(startMin + service.duration);
    const dateObj = new Date(date + 'T00:00:00Z');

    // Double booking check + create in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const overlapping = await tx.appointment.findFirst({
        where: {
          date: dateObj,
          status: { notIn: ['cancelled', 'no_show'] },
          OR: [
            { startTime: { lt: endTime }, endTime: { gt: startTime } },
          ],
        },
      });
      if (overlapping) {
        throw new Error('SLOT_TAKEN');
      }

      // Find or create customer (dedup by phone / name so visit count accumulates)
      const customer = await findOrCreateCustomer(tx, { name, phone });

      const appointment = await tx.appointment.create({
        data: {
          customerId: customer.id,
          serviceId: service.id,
          date: dateObj,
          startTime,
          endTime,
          price: service.price,
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
    const barberMsg = `🆕 Yangi bron!\n\n👤 ${appt?.customer?.name}\n📱 ${appt?.customer?.phone}\n✂️ ${appt?.service?.name}\n📅 ${date}\n🕐 ${startTime} - ${endTime}\n💰 ${(appt?.price ?? 0).toLocaleString()} so'm`;
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
