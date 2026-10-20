export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function GET(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const where: any = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    } : {};

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { appointments: true } },
        appointments: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const result = await Promise.all(customers.map(async (c: any) => {
      const totalSpent = await prisma.appointment.aggregate({
        where: { customerId: c.id, status: 'completed' },
        _sum: { price: true },
      });
      return {
        ...c,
        totalVisits: c?._count?.appointments ?? 0,
        lastVisit: c?.appointments?.[0]?.date ?? null,
        totalSpent: totalSpent?._sum?.price ?? 0,
      };
    }));

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('Customers error:', e?.message);
    return NextResponse.json([], { status: 500 });
  }
}
