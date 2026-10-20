import { prisma } from '@/lib/db';

interface TimeSlot {
  start: string; // "HH:MM"
  end: string;
}

function timeToMinutes(t: string): number {
  const [h, m] = (t ?? '00:00').split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// Uzbekistan (Asia/Tashkent) is a fixed UTC+5 offset (no DST). Return the current
// "wall clock" date (YYYY-MM-DD) and minutes-since-midnight in Tashkent.
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
export function tashkentNow(): { date: string; minutes: number } {
  const tk = new Date(Date.now() + TASHKENT_OFFSET_MS);
  const date = tk.toISOString().split('T')[0];
  const minutes = tk.getUTCHours() * 60 + tk.getUTCMinutes();
  return { date, minutes };
}

export async function getAvailableSlots(
  dateStr: string,
  serviceDuration: number,
  slotInterval?: number
): Promise<string[]> {
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = date.getUTCDay();

  // Check day off
  const dayOff = await prisma.dayOff.findFirst({
    where: { date },
  });
  if (dayOff) return [];

  // Get working schedule
  const schedule = await prisma.workingSchedule.findUnique({
    where: { dayOfWeek },
  });
  if (!schedule || !schedule.isWorking) return [];

  // Get settings for slot interval
  const settings = await prisma.businessSettings.findFirst();
  const interval = slotInterval ?? settings?.slotInterval ?? 30;

  const workStart = timeToMinutes(schedule.startTime);
  const workEnd = timeToMinutes(schedule.endTime);

  // Get breaks for this day
  const breaks = await prisma.breakTime.findMany({
    where: {
      OR: [
        { dayOfWeek },
        { date },
      ],
    },
  });

  // Get existing bookings
  const appointments = await prisma.appointment.findMany({
    where: {
      date,
      status: { notIn: ['cancelled', 'no_show'] },
    },
    select: { startTime: true, endTime: true },
  });

  // Generate slots
  const slots: string[] = [];
  for (let t = workStart; t + serviceDuration <= workEnd; t += interval) {
    const slotStart = t;
    const slotEnd = t + serviceDuration;

    // Check break overlap
    const breakOverlap = breaks.some((b: any) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return slotStart < bEnd && slotEnd > bStart;
    });
    if (breakOverlap) continue;

    // Check appointment overlap
    const apptOverlap = appointments.some((a: any) => {
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      return slotStart < aEnd && slotEnd > aStart;
    });
    if (apptOverlap) continue;

    slots.push(minutesToTime(slotStart));
  }

  // Hide slots that have already passed today (Asia/Tashkent).
  const now = tashkentNow();
  if (dateStr === now.date) {
    return slots.filter((t) => timeToMinutes(t) > now.minutes);
  }

  return slots;
}

export { timeToMinutes, minutesToTime };
