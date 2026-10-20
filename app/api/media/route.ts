export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getObjectByPath } from '@/lib/s3';

// Public read-only proxy for images stored in the private bucket (e.g. barber avatar).
// Only whitelisted prefixes are served.
const ALLOWED_PREFIXES = ['avatars/'];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const path = (searchParams.get('path') || '').replace(/^\/+/, '');
    if (!path || path.includes('..')) {
      return NextResponse.json({ error: 'Bad path' }, { status: 400 });
    }
    if (!ALLOWED_PREFIXES.some((p) => path.startsWith(p))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { body, contentType } = await getObjectByPath(path);
    return new NextResponse(body as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
