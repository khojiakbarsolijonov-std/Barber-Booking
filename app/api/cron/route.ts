export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Health check endpoint for scheduler
export async function GET() {
  return NextResponse.json({ ok: true, scheduler: 'running' });
}
