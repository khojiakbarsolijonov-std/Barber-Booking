export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const services = await prisma.service.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json(services);
  } catch (e: any) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { name, description, price, duration, imageUrl, rebookingReminderDays, isActive, order } = body ?? {};
    if (!name || !price || !duration) {
      return NextResponse.json({ error: 'Nom, narx va davomiylik kerak' }, { status: 400 });
    }
    const service = await prisma.service.create({
      data: {
        name,
        description: description ?? null,
        price: Number(price),
        duration: Number(duration),
        imageUrl: imageUrl ?? null,
        rebookingReminderDays: rebookingReminderDays ? Number(rebookingReminderDays) : null,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    });
    return NextResponse.json(service, { status: 201 });
  } catch (e: any) {
    console.error('Service create error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
