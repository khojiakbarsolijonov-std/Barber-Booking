export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function POST(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { date, reason } = await req.json();
    const dayOff = await prisma.dayOff.create({
      data: { date: new Date(date + 'T00:00:00Z'), reason: reason ?? null },
    });
    return NextResponse.json(dayOff, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
