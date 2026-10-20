export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const reminders = await prisma.rebookingReminder.findMany({
      include: { customer: true, service: true, appointment: true },
      orderBy: { scheduledDate: 'desc' },
      take: 100,
    });
    return NextResponse.json(reminders);
  } catch (e: any) {
    return NextResponse.json([], { status: 500 });
  }
}
