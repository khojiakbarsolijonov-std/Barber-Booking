export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        appointments: {
          include: { service: true },
          orderBy: { date: 'desc' },
        },
        reminders: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!customer) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });

    const totalSpent = await prisma.appointment.aggregate({
      where: { customerId: id, status: 'completed' },
      _sum: { price: true },
    });

    return NextResponse.json({ ...customer, totalSpent: totalSpent?._sum?.price ?? 0 });
  } catch (e: any) {
    console.error('Customer detail error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { notes } = body ?? {};
    const customer = await prisma.customer.update({
      where: { id },
      data: { notes },
    });
    return NextResponse.json(customer);
  } catch (e: any) {
    console.error('Customer update error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
