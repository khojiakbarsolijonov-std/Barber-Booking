export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function POST(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { date, dayOfWeek, startTime, endTime, label } = body ?? {};
    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Vaqt oralig\'i kerak' }, { status: 400 });
    }
    const data: any = { startTime, endTime, label: label ?? 'Tanaffus' };
    if (date) data.date = new Date(date + 'T00:00:00Z');
    if (dayOfWeek !== undefined && dayOfWeek !== null) data.dayOfWeek = dayOfWeek;
    const breakTime = await prisma.breakTime.create({ data });
    return NextResponse.json(breakTime, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
