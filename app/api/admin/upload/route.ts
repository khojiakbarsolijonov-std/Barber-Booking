export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { uploadFile } from '@/lib/s3';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 });

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Faqat rasm fayllari (JPG, PNG, WEBP)' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Rasm hajmi 8MB dan katta' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `avatars/avatar-${Date.now()}.${ext}`;
    const stored = await uploadFile(path, buffer, file.type);

    // Same-origin proxy URL (bucket is private) — persisted in BusinessSettings.avatarUrl.
    const url = `/api/media?path=${encodeURIComponent(stored)}`;
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error('Upload error:', e?.message);
    return NextResponse.json({ error: 'Yuklashda xatolik' }, { status: 500 });
  }
}
