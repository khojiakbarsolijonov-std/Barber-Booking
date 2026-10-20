export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(admin);
}
