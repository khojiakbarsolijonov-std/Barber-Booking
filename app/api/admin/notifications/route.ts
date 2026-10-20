export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function GET(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    const notifs = await prisma.notification.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(notifs);
  } catch (e: any) {
    return NextResponse.json([], { status: 500 });
  }
}
