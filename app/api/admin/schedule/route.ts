export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const schedule = await prisma.workingSchedule.findMany({ orderBy: { dayOfWeek: 'asc' } });
    const breaks = await prisma.breakTime.findMany({ orderBy: { startTime: 'asc' } });
    const daysOff = await prisma.dayOff.findMany({ orderBy: { date: 'asc' } });
    return NextResponse.json({ schedule, breaks, daysOff });
  } catch (e: any) {
    return NextResponse.json({ schedule: [], breaks: [], daysOff: [] }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { schedule } = body ?? {};
    if (Array.isArray(schedule)) {
      for (const s of schedule) {
        await prisma.workingSchedule.upsert({
          where: { dayOfWeek: s.dayOfWeek },
          update: { isWorking: s.isWorking, startTime: s.startTime, endTime: s.endTime },
          create: { dayOfWeek: s.dayOfWeek, isWorking: s.isWorking, startTime: s.startTime, endTime: s.endTime },
        });
      }
    }
    const updated = await prisma.workingSchedule.findMany({ orderBy: { dayOfWeek: 'asc' } });
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('Schedule update error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
