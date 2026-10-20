export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/availability';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');
    if (!date || !serviceId) {
      return NextResponse.json({ error: 'date va serviceId kerak' }, { status: 400 });
    }
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Xizmat topilmadi' }, { status: 404 });
    }
    const slots = await getAvailableSlots(date, service.duration);
    return NextResponse.json({ slots, duration: service.duration });
  } catch (e: any) {
    console.error('Availability error:', e?.message);
    return NextResponse.json({ slots: [] }, { status: 500 });
  }
}
