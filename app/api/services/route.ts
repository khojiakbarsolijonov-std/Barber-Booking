export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(services);
  } catch (e: any) {
    console.error('Services error:', e?.message);
    return NextResponse.json([], { status: 500 });
  }
}
