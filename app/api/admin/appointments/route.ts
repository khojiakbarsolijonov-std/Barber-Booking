export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';
import { timeToMinutes, minutesToTime } from '@/lib/availability';
import { sendTelegramMessage, sendBarberNotification } from '@/lib/telegram';
import { findOrCreateCustomer } from '@/lib/customer';

export async function GET(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');

    const where: any = {};
    if (status) where.status = status;
    if (date) where.date = new Date(date + 'T00:00:00Z');
    if (serviceId) where.serviceId = serviceId;

    const appointments = await prisma.appointment.findMany({
      where,
      include: { customer: true, service: true },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
      take: 100,
    });
    return NextResponse.json(appointments);
  } catch (e: any) {
    console.error('Admin appointments error:', e?.message);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { customerId, name, phone, serviceId, date, startTime } = body ?? {};
    if (!serviceId || !date || !startTime) {
      return NextResponse.json({ error: 'Kerakli maydonlar to\'ldirilmagan' }, { status: 400 });
    }
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: 'Xizmat topilmadi' }, { status: 404 });

    const startMin = timeToMinutes(startTime);
    const endTime = minutesToTime(startMin + service.duration);
    const dateObj = new Date(date + 'T00:00:00Z');

    const result = await prisma.$transaction(async (tx: any) => {
      const overlapping = await tx.appointment.findFirst({
        where: {
          date: dateObj,
          status: { notIn: ['cancelled', 'no_show'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (overlapping) throw new Error('SLOT_TAKEN');

      let cust: any;
      if (customerId) {
        cust = await tx.customer.findUnique({ where: { id: customerId } });
      } else if (phone) {
        cust = await findOrCreateCustomer(tx, { name, phone });
      }
      if (!cust) throw new Error('CUSTOMER_NOT_FOUND');

      const appt = await tx.appointment.create({
        data: {
          customerId: cust.id,
          serviceId: service.id,
          date: dateObj,
          startTime,
          endTime,
          price: service.price,
          status: 'confirmed',
        },
        include: { customer: true, service: true },
      });
      return appt;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e?.message === 'SLOT_TAKEN') {
      return NextResponse.json({ error: 'Bu vaqt band' }, { status: 409 });
    }
    if (e?.message === 'CUSTOMER_NOT_FOUND') {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 400 });
    }
    console.error('Admin create appointment error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
