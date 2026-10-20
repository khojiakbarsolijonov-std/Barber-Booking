const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const BARBER_ID = process.env.BARBER_TELEGRAM_ID ?? '';

function isConfigured(): boolean {
  return BOT_TOKEN !== '' && BOT_TOKEN !== 'placeholder';
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: { parse_mode?: string; reply_markup?: any }
): Promise<boolean> {
  if (!isConfigured() || !chatId) return false;
  try {
    const body: any = { chat_id: chatId, text, parse_mode: 'HTML', ...(options ?? {}) };
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data?.ok === true;
  } catch (e: any) {
    console.error('Telegram send error:', e?.message);
    return false;
  }
}

export async function sendBarberNotification(text: string): Promise<boolean> {
  if (!BARBER_ID || BARBER_ID === 'placeholder') return false;
  return sendTelegramMessage(BARBER_ID, text);
}

export function getBotToken() {
  return BOT_TOKEN;
}

export function isBot() {
  return isConfigured();
}
