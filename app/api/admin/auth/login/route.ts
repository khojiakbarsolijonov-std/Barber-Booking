export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticateAdmin, signAdminToken, setAdminCookie } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Login va parol kiritish shart' }, { status: 400 });
    }
    const admin = await authenticateAdmin(username, password);
    if (!admin) {
      return NextResponse.json({ error: 'Login yoki parol noto\'g\'ri' }, { status: 401 });
    }
    const token = signAdminToken(admin.id, admin.name ?? admin.email);
    await setAdminCookie(token);
    return NextResponse.json({ success: true, username: admin.name ?? admin.email });
  } catch (e: any) {
    console.error('Admin login error:', e?.message);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
