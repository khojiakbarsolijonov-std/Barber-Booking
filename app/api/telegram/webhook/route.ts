export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendTelegramMessage, sendBarberNotification } from '@/lib/telegram';
import { findOrCreateCustomer } from '@/lib/customer';
import { getAvailableSlots, timeToMinutes, minutesToTime } from '@/lib/availability';

export async function POST(req: Request) {
  try {
    // Verify the request really comes from Telegram (secret_token set on setWebhook).
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
      const got = req.headers.get('x-telegram-bot-api-secret-token');
      if (got !== secret) {
        return NextResponse.json({ ok: false }, { status: 401 });
      }
    }

    const body = await req.json();
    const message = body?.message;
    const callback = body?.callback_query;

    if (message) {
      await handleMessage(message);
    }
    if (callback) {
      await handleCallback(callback);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Webhook error:', e?.message);
    return NextResponse.json({ ok: true });
  }
}

// ---------------------------------------------------------------------------
// Date / time helpers (Asia/Tashkent, UTC+5)
// ---------------------------------------------------------------------------
const WEEKDAYS_UZ = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const MONTHS_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

function todayTashkent(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function nowMinutesTashkent(): number {
  const hm = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
  return timeToMinutes(hm);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const wd = WEEKDAYS_UZ[d.getUTCDay()];
  const day = d.getUTCDate();
  const month = MONTHS_UZ[d.getUTCMonth()];
  const today = todayTashkent();
  let prefix = '';
  if (dateStr === today) prefix = 'Bugun, ';
  else if (dateStr === addDays(today, 1)) prefix = 'Ertaga, ';
  return `${prefix}${wd} ${day}-${month}`;
}

async function answerCallback(callbackId: string, text?: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId, ...(text ? { text } : {}) }),
    });
  } catch {}
}

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------
async function handleMessage(msg: any) {
  const chatId = String(msg?.chat?.id ?? '');
  const text = (msg?.text ?? '').trim();
  const username = msg?.from?.username ?? '';

  // Shared contact (phone number) — link/create customer, then show services
  if (msg?.contact) {
    await handleContact(chatId, msg, username);
    return;
  }

  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    if (parts.length > 1) {
      await handleDeepLink(chatId, parts[1], username);
    } else {
      await sendWelcome(chatId);
    }
  } else if (text === '/bron' || text === '/book') {
    await startBooking(chatId, username);
  } else if (text === '/mybookings' || text === '/bronlarim') {
    await handleMyBookings(chatId);
  } else if (text === '/help' || text === '/yordam') {
    await sendTelegramMessage(chatId, 'ℹ️ <b>Yordam</b>\n\n✂️ Bron qilish uchun "Bron qilish" tugmasini bosing\n/mybookings — Bronlaringiz\n/bron — Yangi bron');
  } else {
    await sendWelcome(chatId);
  }
}

async function sendWelcome(chatId: string) {
  await sendTelegramMessage(chatId,
    '👋 Assalomu alaykum!\n\n<b>Jasurbek Barber</b> botiga xush kelibsiz! ✂️\n\nBron qilish uchun quyidagi tugmani bosing:',
    { reply_markup: { inline_keyboard: [[{ text: '✂️ Bron qilish', callback_data: 'bkstart' }]] } }
  );
}

async function handleContact(chatId: string, msg: any, username: string) {
  try {
    const contact = msg.contact;
    // Only accept the user's OWN contact
    if (contact?.user_id && String(contact.user_id) !== chatId) {
      await sendTelegramMessage(chatId, 'Iltimos, o\'zingizning raqamingizni yuboring 📱',
        { reply_markup: { keyboard: [[{ text: '📱 Raqamni yuborish', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } });
      return;
    }
    const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || (msg?.from?.first_name ?? 'Mijoz');
    await findOrCreateCustomer(prisma, {
      name,
      phone: contact?.phone_number,
      telegramId: chatId,
      telegramUsername: username || null,
    });
    // Remove the reply keyboard
    await sendTelegramMessage(chatId, '✅ Rahmat! Raqamingiz saqlandi.', { reply_markup: { remove_keyboard: true } });
    await showServices(chatId);
  } catch (e: any) {
    console.error('Contact handle error:', e?.message);
    await sendTelegramMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
  }
}

async function startBooking(chatId: string, username: string) {
  // If we already know this customer's phone, go straight to services
  const customer = await prisma.customer.findUnique({ where: { telegramId: chatId } });
  if (customer && customer.phone) {
    await showServices(chatId);
  } else {
    await sendTelegramMessage(chatId,
      'Bron qilishdan oldin telefon raqamingizni yuboring 📱\n\nQuyidagi tugmani bosing:',
      { reply_markup: { keyboard: [[{ text: '📱 Raqamni yuborish', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } }
    );
  }
}

async function showServices(chatId: string) {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  if (services.length === 0) {
    await sendTelegramMessage(chatId, 'Hozircha xizmatlar mavjud emas.');
    return;
  }
  const rows = services.map((s: any) => ([{
    text: `${s.name} — ${(s.price ?? 0).toLocaleString()} so'm`,
    callback_data: `svc|${s.id}`,
  }]));
  await sendTelegramMessage(chatId, '✂️ <b>Xizmatni tanlang:</b>', { reply_markup: { inline_keyboard: rows } });
}

async function showDays(chatId: string, serviceId: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    await sendTelegramMessage(chatId, '❌ Xizmat topilmadi.');
    return;
  }
  const today = todayTashkent();
  const rows: any[] = [];
  let found = 0;
  for (let i = 0; i < 21 && found < 8; i++) {
    const dateStr = addDays(today, i);
    let slots = await getAvailableSlots(dateStr, service.duration);
    // For today, drop slots that already passed
    if (dateStr === today) {
      const nowMin = nowMinutesTashkent();
      slots = slots.filter((t) => timeToMinutes(t) > nowMin);
    }
    if (slots.length > 0) {
      rows.push([{ text: formatDayLabel(dateStr), callback_data: `day|${serviceId}|${dateStr}` }]);
      found++;
    }
  }
  if (rows.length === 0) {
    await sendTelegramMessage(chatId, 'Afsuski, yaqin kunlarda bo\'sh vaqt yo\'q. Iltimos keyinroq urinib ko\'ring.');
    return;
  }
  rows.push([{ text: '« Xizmatlar', callback_data: 'bkstart' }]);
  await sendTelegramMessage(chatId, `📅 <b>Kunni tanlang</b>\n(${service.name})`, { reply_markup: { inline_keyboard: rows } });
}

async function showSlots(chatId: string, serviceId: string, dateStr: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    await sendTelegramMessage(chatId, '❌ Xizmat topilmadi.');
    return;
  }
  let slots = await getAvailableSlots(dateStr, service.duration);
  if (dateStr === todayTashkent()) {
    const nowMin = nowMinutesTashkent();
    slots = slots.filter((t) => timeToMinutes(t) > nowMin);
  }
  if (slots.length === 0) {
    await sendTelegramMessage(chatId, 'Bu kunda bo\'sh vaqt qolmadi. Boshqa kunni tanlang.',
      { reply_markup: { inline_keyboard: [[{ text: '« Kunlar', callback_data: `svc|${serviceId}` }]] } });
    return;
  }
  // 3 slots per row
  const rows: any[] = [];
  for (let i = 0; i < slots.length; i += 3) {
    rows.push(slots.slice(i, i + 3).map((t) => ({ text: t, callback_data: `slot|${serviceId}|${dateStr}|${t}` })));
  }
  rows.push([{ text: '« Kunlar', callback_data: `svc|${serviceId}` }]);
  await sendTelegramMessage(chatId, `🕐 <b>Vaqtni tanlang</b>\n${formatDayLabel(dateStr)}`, { reply_markup: { inline_keyboard: rows } });
}

async function confirmBooking(chatId: string, serviceId: string, dateStr: string, startTime: string, username: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    await sendTelegramMessage(chatId, '❌ Xizmat topilmadi.');
    return;
  }
  const customer = await prisma.customer.findUnique({ where: { telegramId: chatId } });
  if (!customer) {
    await startBooking(chatId, username);
    return;
  }
  const startMin = timeToMinutes(startTime);
  const endTime = minutesToTime(startMin + service.duration);
  const dateObj = new Date(dateStr + 'T00:00:00Z');

  try {
    const appt = await prisma.$transaction(async (tx: any) => {
      const overlapping = await tx.appointment.findFirst({
        where: {
          date: dateObj,
          status: { notIn: ['cancelled', 'no_show'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (overlapping) throw new Error('SLOT_TAKEN');
      return tx.appointment.create({
        data: {
          customerId: customer.id,
          serviceId: service.id,
          date: dateObj,
          startTime,
          endTime,
          price: service.price,
          status: 'confirmed',
        },
        include: { customer: true, service: true },
      });
    });

    const settings = await prisma.businessSettings.findFirst();
    await sendTelegramMessage(chatId,
      `✅ <b>Bron tasdiqlandi!</b>\n\n✂️ ${service.name}\n📅 ${formatDayLabel(dateStr)}\n🕐 ${startTime} - ${endTime}\n💰 ${(service.price ?? 0).toLocaleString()} so'm\n📍 ${settings?.address ?? ''}\n\nBron vaqtidan oldin eslatma olasiz! 🔔\nRahmat, sizni kutib qolamiz! 🙏`
    );

    const barberMsg = `🆕 Yangi bron (Telegram)!\n\n👤 ${appt?.customer?.name}\n📱 ${appt?.customer?.phone}\n✂️ ${service.name}\n📅 ${dateStr}\n🕐 ${startTime} - ${endTime}\n💰 ${(service.price ?? 0).toLocaleString()} so'm`;
    sendBarberNotification(barberMsg).catch(() => {});
  } catch (e: any) {
    if (e?.message === 'SLOT_TAKEN') {
      await sendTelegramMessage(chatId, '❌ Kechirasiz, bu vaqt endigina band bo\'ldi. Boshqa vaqtni tanlang.',
        { reply_markup: { inline_keyboard: [[{ text: '« Vaqtlar', callback_data: `day|${serviceId}|${dateStr}` }]] } });
      return;
    }
    console.error('Bot booking error:', e?.message);
    await sendTelegramMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
  }
}

// ---------------------------------------------------------------------------
// Deep link + my bookings
// ---------------------------------------------------------------------------
async function handleDeepLink(chatId: string, token: string, username: string) {
  try {
    const linkToken = await prisma.telegramLinkToken.findUnique({ where: { token } });
    if (!linkToken || linkToken.used || new Date() > linkToken.expiresAt) {
      await sendTelegramMessage(chatId, '❌ Bu link eskirgan yoki allaqachon ishlatilgan.');
      await sendWelcome(chatId);
      return;
    }
    await prisma.customer.update({
      where: { id: linkToken.customerId },
      data: { telegramId: chatId, telegramUsername: username || null },
    });
    await prisma.telegramLinkToken.update({ where: { id: linkToken.id }, data: { used: true } });

    if (linkToken.appointmentId) {
      const appt = await prisma.appointment.findUnique({
        where: { id: linkToken.appointmentId },
        include: { service: true },
      });
      if (appt) {
        const dateStr = appt.date instanceof Date ? appt.date.toISOString().split('T')[0] : String(appt.date);
        await sendTelegramMessage(chatId,
          `✅ Telegram ulandi!\n\nSizning broningiz:\n✂️ ${appt?.service?.name ?? ''}\n📅 ${dateStr}\n🕐 ${appt.startTime} - ${appt.endTime}\n💰 ${(appt.price ?? 0).toLocaleString()} so'm\n\nBron vaqtidan oldin eslatma olasiz! 🔔`
        );
      }
    } else {
      await sendTelegramMessage(chatId, '✅ Telegram ulandi! Endi xabarlarni shu yerda olasiz.');
    }
  } catch (e: any) {
    console.error('Deep link error:', e?.message);
    await sendTelegramMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
  }
}

async function handleMyBookings(chatId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { telegramId: chatId },
      include: {
        appointments: {
          where: { status: { notIn: ['cancelled', 'no_show'] } },
          include: { service: true },
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });
    if (!customer || (customer?.appointments?.length ?? 0) === 0) {
      await sendTelegramMessage(chatId, '📋 Hozircha bronlaringiz yo\'q.',
        { reply_markup: { inline_keyboard: [[{ text: '✂️ Bron qilish', callback_data: 'bkstart' }]] } });
      return;
    }
    const today = todayTashkent();
    const nowMin = nowMinutesTashkent();
    let msg = '📋 <b>Sizning bronlaringiz:</b>\n\n';
    const buttons: any[] = [];
    for (const a of (customer?.appointments ?? [])) {
      const dateStr = a.date instanceof Date ? a.date.toISOString().split('T')[0] : String(a.date);
      const isFuture = dateStr > today || (dateStr === today && timeToMinutes(a.startTime) > nowMin);
      msg += `✂️ ${a?.service?.name ?? ''}\n📅 ${dateStr} | 🕐 ${a.startTime}\n💰 ${(a.price ?? 0).toLocaleString()} so'm\n\n`;
      if (isFuture) {
        buttons.push([{ text: `❌ Bekor qilish — ${dateStr} ${a.startTime}`, callback_data: `cxl|${a.id}` }]);
      }
    }
    await sendTelegramMessage(chatId, msg,
      buttons.length > 0 ? { reply_markup: { inline_keyboard: buttons } } : undefined);
  } catch (e: any) {
    console.error('My bookings error:', e?.message);
    await sendTelegramMessage(chatId, '❌ Xatolik yuz berdi.');
  }
}

async function confirmCancelPrompt(chatId: string, apptId: string) {
  const customer = await prisma.customer.findUnique({ where: { telegramId: chatId } });
  if (!customer) return;
  const appt = await prisma.appointment.findUnique({ where: { id: apptId }, include: { service: true } });
  if (!appt || appt.customerId !== customer.id) {
    await sendTelegramMessage(chatId, '❌ Bron topilmadi.');
    return;
  }
  const dateStr = appt.date instanceof Date ? appt.date.toISOString().split('T')[0] : String(appt.date);
  await sendTelegramMessage(chatId,
    `❗ Ushbu bronni bekor qilmoqchimisiz?\n\n✂️ ${appt?.service?.name ?? ''}\n📅 ${dateStr} | 🕐 ${appt.startTime}`,
    { reply_markup: { inline_keyboard: [[
      { text: '✅ Ha, bekor qilish', callback_data: `cxlyes|${appt.id}` },
      { text: '« Yo\'q', callback_data: 'cxlno' },
    ]] } }
  );
}

async function cancelBooking(chatId: string, apptId: string) {
  const customer = await prisma.customer.findUnique({ where: { telegramId: chatId } });
  if (!customer) return;
  const appt = await prisma.appointment.findUnique({ where: { id: apptId }, include: { service: true } });
  if (!appt || appt.customerId !== customer.id) {
    await sendTelegramMessage(chatId, '❌ Bron topilmadi.');
    return;
  }
  if (appt.status === 'cancelled') {
    await sendTelegramMessage(chatId, 'Bu bron allaqachon bekor qilingan.');
    return;
  }
  const dateStr = appt.date instanceof Date ? appt.date.toISOString().split('T')[0] : String(appt.date);
  await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'cancelled' } });
  await sendTelegramMessage(chatId,
    `✅ Broningiz bekor qilindi.\n\n✂️ ${appt?.service?.name ?? ''}\n📅 ${dateStr} | 🕐 ${appt.startTime}\n\nYana bron qilmoqchi bo\'lsangiz, "Bron qilish" tugmasini bosing.`,
    { reply_markup: { inline_keyboard: [[{ text: '✂️ Bron qilish', callback_data: 'bkstart' }]] } }
  );
  const barberMsg = `❌ Bron bekor qilindi (mijoz)\n\n👤 ${customer.name}\n📱 ${customer.phone}\n✂️ ${appt?.service?.name ?? ''}\n📅 ${dateStr} | 🕐 ${appt.startTime}`;
  sendBarberNotification(barberMsg).catch(() => {});
}

// ---------------------------------------------------------------------------
// Callback (inline keyboard) handling
// ---------------------------------------------------------------------------
async function handleCallback(callback: any) {
  const chatId = String(callback?.message?.chat?.id ?? '');
  const data = String(callback?.data ?? '');
  const username = callback?.from?.username ?? '';
  await answerCallback(callback?.id);

  try {
    if (data === 'bkstart') {
      await startBooking(chatId, username);
    } else if (data.startsWith('svc|')) {
      const [, serviceId] = data.split('|');
      await showDays(chatId, serviceId);
    } else if (data.startsWith('day|')) {
      const [, serviceId, dateStr] = data.split('|');
      await showSlots(chatId, serviceId, dateStr);
    } else if (data.startsWith('slot|')) {
      const [, serviceId, dateStr, time] = data.split('|');
      await confirmBooking(chatId, serviceId, dateStr, time, username);
    } else if (data.startsWith('cxl|')) {
      const [, apptId] = data.split('|');
      await confirmCancelPrompt(chatId, apptId);
    } else if (data.startsWith('cxlyes|')) {
      const [, apptId] = data.split('|');
      await cancelBooking(chatId, apptId);
    } else if (data === 'cxlno') {
      await sendTelegramMessage(chatId, 'Bekor qilinmadi. Broningiz saqlanib qoldi ✅');
    }
  } catch (e: any) {
    console.error('Callback error:', e?.message);
  }
}
