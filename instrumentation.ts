export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Start cron jobs only on server
    const { startScheduler } = await import('@/lib/scheduler');
    startScheduler();
  }
}
