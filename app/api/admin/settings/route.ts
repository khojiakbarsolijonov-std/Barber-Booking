export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    let settings = await prisma.businessSettings.findFirst();
    if (!settings) settings = await prisma.businessSettings.create({ data: {} });
    return NextResponse.json(settings);
  } catch (e: any) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    let settings = await prisma.businessSettings.findFirst();
    if (!settings) settings = await prisma.businessSettings.create({ data: {} });
    const { id, createdAt, updatedAt, ...updateData } = body;
    const updated = await prisma.businessSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('Settings update error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
