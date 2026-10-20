import cron from 'node-cron';

let started = false;

// Uzbekistan (Asia/Tashkent) is a fixed UTC+5 offset (no DST).
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
function tashkentWallClock(extraMs = 0): { dateStr: string; time: string; hour: number; minute: number } {
  const tk = new Date(Date.now() + TASHKENT_OFFSET_MS + extraMs);
  const dateStr = tk.toISOString().split('T')[0];
  const hour = tk.getUTCHours();
  const minute = tk.getUTCMinutes();
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return { dateStr, time, hour, minute };
}

export function startScheduler() {
  if (started) return;
  started = true;
  console.log('[Scheduler] Starting cron jobs...');

  // 30-minute reminder: check every minute
  cron.schedule('* * * * *', async () => {
    try {
      const { prisma } = await import('@/lib/db');
      const { sendTelegramMessage, sendBarberNotification } = await import('@/lib/telegram');

      // "30 minutes from now" in Tashkent wall-clock time.
      const t30 = tashkentWallClock(30 * 60 * 1000);
      const targetDate = new Date(t30.dateStr + 'T00:00:00Z');
      const targetTime = t30.time;

      const appointments = await prisma.appointment.findMany({
        where: {
          date: targetDate,
          status: { in: ['confirmed', 'new'] },
          startTime: targetTime,
          reminderSentAt: null,
        },
        include: { customer: true, service: true },
      });

      for (const appt of (appointments ?? [])) {
        if (appt?.customer?.telegramId) {
          const msg = `⏰ Eslatma!\n\n30 daqiqadan keyin sizning bronigiz bor:\n✂️ ${appt?.service?.name ?? ''}\n🕐 ${appt.startTime ?? ''}\n\nSizni kutib qolamiz!`;
          await sendTelegramMessage(appt.customer.telegramId, msg);
        }
        await sendBarberNotification(`⏰ 30 daq: ${appt?.customer?.name ?? ''} - ${appt?.service?.name ?? ''} - ${appt.startTime ?? ''}`);
        await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSentAt: new Date() } });
      }
    } catch (e: any) {
      console.error('[Scheduler] 30min reminder error:', e?.message);
    }
  });

  // Rebooking reminders: check every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const { prisma } = await import('@/lib/db');
      const { sendTelegramMessage } = await import('@/lib/telegram');

      const settings = await prisma.businessSettings.findFirst();

      // Only send rebooking reminders at the configured hour (Tashkent time).
      const tk = tashkentWallClock();
      const reminderTime = settings?.rebookingReminderTime ?? '11:00';
      const reminderHour = Number((reminderTime.split(':')[0] ?? '11'));
      if (tk.hour !== reminderHour) return;

      const today = new Date(tk.dateStr + 'T00:00:00Z');
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      const reminders = await prisma.rebookingReminder.findMany({
        where: {
          scheduledDate: { gte: today, lt: tomorrow },
          status: 'scheduled',
        },
        include: { customer: true, service: true },
      });

      for (const r of (reminders ?? [])) {
        if (r?.customer?.telegramId) {
          let msg = settings?.rebookingMessageTemplate ?? 'Assalomu alaykum, {name}! Yana bron qiling!';
          msg = msg.replace('{name}', r?.customer?.name ?? '');
          msg = msg.replace('{days}', String(r?.reminderDays ?? 0));
          const sent = await sendTelegramMessage(r.customer.telegramId, msg);
          await prisma.rebookingReminder.update({
            where: { id: r.id },
            data: sent ? { status: 'sent', sentAt: new Date() } : { status: 'failed' },
          });
        }
      }
    } catch (e: any) {
      console.error('[Scheduler] Rebooking reminder error:', e?.message);
    }
  });

  console.log('[Scheduler] Cron jobs started successfully');
}
