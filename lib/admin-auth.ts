import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? 'fallback-secret';
const TOKEN_NAME = 'admin_token';
const EXPIRY = '24h';

export function signAdminToken(adminId: string, username: string): string {
  return jwt.sign({ adminId, username, role: 'admin' }, JWT_SECRET, { expiresIn: EXPIRY });
}

export async function verifyAdminToken(): Promise<{ adminId: string; username: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { adminId: decoded?.adminId, username: decoded?.username };
  } catch {
    return null;
  }
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

export async function authenticateAdmin(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: username }, { name: username }], role: 'admin' },
  });
  if (!user || !user.password) return null;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  return user;
}
