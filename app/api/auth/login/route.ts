export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { signIn } from '@/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const result = await signIn('credentials', {
      email, password, redirect: false,
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Noto\'g\'ri email yoki parol' }, { status: 401 });
  }
}
