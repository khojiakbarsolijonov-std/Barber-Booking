// Shared customer matching / dedup logic so the SAME person is never split across
// multiple customer rows (which would split their visit count "Tashriflar soni").
//
// Matching priority when someone books again (web, admin, or Telegram bot):
//   1. Telegram id (exact)   — same Telegram account
//   2. Phone number (canonicalized, so "+998 90 561 88 52" == "998905618852")
//   3. Full name (first + last, case-insensitive) — only when the name has 2+ words,
//      so a single first name like "Abdulla" is never merged with a stranger.

// Canonicalize an Uzbek phone number to "+998XXXXXXXXX" so all formats collapse
// to one comparable value. Falls back to the raw string when it can't be parsed.
export function canonicalPhone(raw?: string | null): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return (raw ?? '').trim();
  let d = digits;
  if (d.length === 9) d = '998' + d;              // 901234567 -> 998901234567
  else if (d.length === 12 && d.startsWith('998')) { /* already full */ }
  else if (d.length === 13 && d.startsWith('8') && d[1] === '9') d = d.slice(1); // stray leading 8
  return '+' + d;
}

export function normalizeName(name?: string | null): string {
  return (name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

interface CustomerInput {
  name?: string | null;
  phone?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
}

// Find an existing customer for this person or create a new one. `tx` is a Prisma
// client or transaction client. Never throws on link/update conflicts.
export async function findOrCreateCustomer(tx: any, input: CustomerInput) {
  const name = (input.name ?? '').trim();
  const canon = canonicalPhone(input.phone);
  const tgId = input.telegramId ? String(input.telegramId) : null;
  const tgUser = input.telegramUsername ?? null;

  let customer: any = null;

  // 1. Telegram id
  if (tgId) {
    customer = await tx.customer.findUnique({ where: { telegramId: tgId } });
  }
  // 2. Phone (canonical, then raw as stored for legacy rows)
  if (!customer && canon) {
    customer = await tx.customer.findFirst({ where: { phone: canon } });
  }
  if (!customer && input.phone && input.phone !== canon) {
    customer = await tx.customer.findFirst({ where: { phone: input.phone } });
  }
  // 3. Full name (2+ words only)
  if (!customer && name && normalizeName(name).split(' ').length >= 2) {
    customer = await tx.customer.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  if (customer) {
    const data: any = {};
    if (name && customer.name !== name) data.name = name;
    if (canon && customer.phone !== canon) data.phone = canon; // upgrade to canonical form
    if (tgId && !customer.telegramId) data.telegramId = tgId;
    if (tgUser && !customer.telegramUsername) data.telegramUsername = tgUser;
    if (Object.keys(data).length > 0) {
      try {
        customer = await tx.customer.update({ where: { id: customer.id }, data });
      } catch {
        // unique conflict (phone/telegramId already on another row) — keep existing
      }
    }
    return customer;
  }

  return tx.customer.create({
    data: {
      name: name || 'Mijoz',
      phone: canon || (input.phone ?? ''),
      telegramId: tgId,
      telegramUsername: tgUser,
    },
  });
}
