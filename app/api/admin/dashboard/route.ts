export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const weekStart = new Date(today);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    const monthStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);

    // Revenue is bucketed by WHEN the service was marked as rendered (completedAt),
    // not by the appointment date. This way, completing an old (past-dated) booking
    // or an early future booking always adds its revenue to the period it was pressed.
    // Fallback to `date` for legacy completed rows that have no completedAt.
    const completedInRange = (start: Date, end: Date) => ({
      status: 'completed',
      OR: [
        { completedAt: { gte: start, lt: end } },
        { completedAt: null, date: { gte: start, lt: end } },
      ],
    });

    const [todayAppts, todayCompleted, weekAppts, monthAppts, nextAppt, pendingReminders, totalCustomers] = await Promise.all([
      prisma.appointment.findMany({ 
        where: { date: { gte: today, lt: tomorrow } },
        include: { customer: true, service: true },
        orderBy: { startTime: 'asc' },
      }),
      prisma.appointment.findMany({ where: completedInRange(today, tomorrow) }),
      prisma.appointment.findMany({ where: completedInRange(weekStart, tomorrow) }),
      prisma.appointment.findMany({ where: completedInRange(monthStart, tomorrow) }),
      prisma.appointment.findFirst({
        where: { date: { gte: today }, status: { in: ['confirmed', 'new'] } },
        include: { customer: true, service: true },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.rebookingReminder.count({ where: { status: 'scheduled' } }),
      prisma.customer.count(),
    ]);

    const todayRevenue = todayCompleted.reduce((s: number, a: any) => s + (a?.price ?? 0), 0);
    const weekRevenue = weekAppts.reduce((s: number, a: any) => s + (a?.price ?? 0), 0);
    const monthRevenue = monthAppts.reduce((s: number, a: any) => s + (a?.price ?? 0), 0);

    return NextResponse.json({
      todayBookings: todayAppts.filter((a: any) => !['cancelled', 'no_show'].includes(a.status))?.length ?? 0,
      todayCompleted: todayCompleted?.length ?? 0,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      pendingReminders,
      totalCustomers,
      todayAppointments: todayAppts.map((a: any) => ({
        id: a.id,
        customer: a?.customer?.name ?? 'Noma\'lum',
        phone: a?.customer?.phone ?? '',
        service: a?.service?.name ?? '',
        startTime: a.startTime,
        endTime: a.endTime,
        price: a.price,
        status: a.status,
        notes: a.notes,
      })),
      nextAppointment: nextAppt ? {
        id: nextAppt.id,
        customer: nextAppt?.customer?.name,
        phone: nextAppt?.customer?.phone,
        service: nextAppt?.service?.name,
        date: nextAppt.date,
        startTime: nextAppt.startTime,
        endTime: nextAppt.endTime,
        price: nextAppt.price,
      } : null,
    });
  } catch (e: any) {
    console.error('Dashboard error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
