export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';
import { sendTelegramMessage } from '@/lib/telegram';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, cancellationReason } = body ?? {};

    const data: any = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (cancellationReason) data.cancellationReason = cancellationReason;
    if (status === 'completed') data.completedAt = new Date();

    const appt = await prisma.appointment.update({
      where: { id },
      data,
      include: { customer: true, service: true },
    });

    // Send Telegram on completion
    if (status === 'completed' && appt?.customer?.telegramId) {
      const settings = await prisma.businessSettings.findFirst();
      const msg = settings?.thankYouMessage?.replace('{name}', appt?.customer?.name ?? '') ?? 'Rahmat!';
      sendTelegramMessage(appt.customer.telegramId, msg).catch(() => {});

      // Schedule rebooking reminder
      if (settings?.rebookingEnabled) {
        const days = appt?.service?.rebookingReminderDays ?? settings?.defaultRebookingDays ?? 20;
        const scheduledDate = new Date(appt.date);
        scheduledDate.setUTCDate(scheduledDate.getUTCDate() + days);
        await prisma.rebookingReminder.create({
          data: {
            customerId: appt.customerId,
            appointmentId: appt.id,
            serviceId: appt.serviceId,
            scheduledDate,
            scheduledTime: settings?.rebookingReminderTime ?? '11:00',
            reminderDays: days,
          },
        });
      }
    }

    return NextResponse.json(appt);
  } catch (e: any) {
    console.error('Update appointment error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
