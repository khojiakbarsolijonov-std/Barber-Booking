export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    let settings = await prisma.businessSettings.findFirst();
    if (!settings) {
      settings = await prisma.businessSettings.create({ data: {} });
    }
    return NextResponse.json(settings);
  } catch (e: any) {
    console.error('Settings error:', e?.message);
    return NextResponse.json({}, { status: 500 });
  }
}
