import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user (hidden test account)
  const hashedTestPw = await bcrypt.hash('j*aHuYMDX8', 10);
  await prisma.user.upsert({
    where: { email: 'abacus-b9dde978@example.com' },
    update: {},
    create: {
      email: 'abacus-b9dde978@example.com',
      name: 'admin',
      password: hashedTestPw,
      role: 'admin',
    },
  });

  // Admin user (demo - for user access)
  const hashedAdminPw = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@barber.uz' },
    update: {},
    create: {
      email: 'admin@barber.uz',
      name: 'admin',
      password: hashedAdminPw,
      role: 'admin',
    },
  });

  // Business Settings
  const existingSettings = await prisma.businessSettings.findFirst();
  if (!existingSettings) {
    await prisma.businessSettings.create({
      data: {
        businessName: 'Jasurbek Barber',
        barberName: 'Jasurbek Xudoyberganov',
        phone: '+998 90 561 88 52',
        address: "Farg'ona shahar, Beeline ofisi ro'parasida",
        instagram: '@jasur_alijanovich_',
        accentColor: '#C8A97E',
        slotInterval: 30,
        defaultRebookingDays: 20,
        rebookingEnabled: true,
        rebookingReminderTime: '11:00',
        telegramUsername: 'jasurbek_barber_bot',
      },
    });
  }

  // Services
  const serviceData = [
    { name: 'Soch kesish', description: 'Professional erkaklar soch turmagi', price: 150000, duration: 45, rebookingReminderDays: 20, order: 0, imageUrl: 'https://cdn.abacus.ai/images/7b7d84f0-71d6-4ebe-ad53-76337c80fcea.png' },
    { name: 'Soch + Soqol', description: 'Soch kesish va soqol shakllantirish', price: 200000, duration: 60, rebookingReminderDays: 25, order: 1, imageUrl: 'https://cdn.abacus.ai/images/a6fef18a-d253-4096-b17d-8e94abbd4fc0.png' },
    { name: 'Soqol tekislash', description: 'Soqolni professional shaklga keltirish', price: 100000, duration: 30, rebookingReminderDays: 15, order: 2, imageUrl: 'https://cdn.abacus.ai/images/34dd11c9-7b37-4a70-b924-010204035212.png' },
    { name: 'Bolalar soch kesish', description: '14 yoshgacha bolalar uchun', price: 100000, duration: 30, rebookingReminderDays: 20, order: 3, imageUrl: 'https://cdn.abacus.ai/images/0acd286d-7bd1-4049-81bd-dd4430d6e1ea.png' },
    { name: "Soch bo'yash", description: "Professional soch bo'yash xizmati", price: 350000, duration: 90, rebookingReminderDays: 35, order: 4, imageUrl: 'https://cdn.abacus.ai/images/cea33312-1444-4a87-9fdf-3fb51e3ade0d.png' },
    { name: "To'liq paket", description: 'Soch + Soqol + Yuz parvarishi', price: 280000, duration: 90, rebookingReminderDays: 25, order: 5, imageUrl: 'https://cdn.abacus.ai/images/327ffd17-c314-4bc8-bfb4-b9d2f5493e30.png' },
  ];

  for (const s of serviceData) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.service.create({ data: { ...s, isActive: true } });
    }
  }

  // Working Schedule (Mon-Sat: 09:00-20:00, Sun: 10:00-18:00)
  const scheduleData = [
    { dayOfWeek: 0, isWorking: true, startTime: '10:00', endTime: '18:00' },
    { dayOfWeek: 1, isWorking: true, startTime: '09:00', endTime: '20:00' },
    { dayOfWeek: 2, isWorking: true, startTime: '09:00', endTime: '20:00' },
    { dayOfWeek: 3, isWorking: true, startTime: '09:00', endTime: '20:00' },
    { dayOfWeek: 4, isWorking: true, startTime: '09:00', endTime: '20:00' },
    { dayOfWeek: 5, isWorking: true, startTime: '09:00', endTime: '20:00' },
    { dayOfWeek: 6, isWorking: true, startTime: '09:00', endTime: '20:00' },
  ];

  for (const s of scheduleData) {
    await prisma.workingSchedule.upsert({
      where: { dayOfWeek: s.dayOfWeek },
      update: s,
      create: s,
    });
  }

  // Breaks: 13:00-14:00 every day
  for (let d = 0; d <= 6; d++) {
    const existing = await prisma.breakTime.findFirst({ where: { dayOfWeek: d, startTime: '13:00' } });
    if (!existing) {
      await prisma.breakTime.create({ data: { dayOfWeek: d, startTime: '13:00', endTime: '14:00', label: 'Tushlik' } });
    }
  }

  // Customers
  const customers = [
    { name: 'Akbar Toshmatov', phone: '+998901234561', telegramId: '100001', telegramUsername: 'akbar_t' },
    { name: 'Bobur Karimov', phone: '+998901234562' },
    { name: 'Jasur Nazarov', phone: '+998901234563', telegramId: '100003', telegramUsername: 'jasur_n' },
    { name: 'Dilshod Umarov', phone: '+998901234564' },
    { name: 'Eldor Raximov', phone: '+998901234565', telegramId: '100005', telegramUsername: 'eldor_r' },
    { name: 'Farrux Sobirov', phone: '+998901234566' },
    { name: "G'ayrat Yunusov", phone: '+998901234567' },
    { name: 'Hamid Tursunov', phone: '+998901234568', telegramId: '100008', telegramUsername: 'hamid_t' },
    { name: 'Ikrom Xolmatov', phone: '+998901234569' },
    { name: 'Jahongir Mirzayev', phone: '+998901234560' },
  ];

  const createdCustomers: any[] = [];
  for (const c of customers) {
    const existing = await prisma.customer.findUnique({ where: { phone: c.phone } });
    if (existing) {
      createdCustomers.push(existing);
    } else {
      const created = await prisma.customer.create({ data: c as any });
      createdCustomers.push(created);
    }
  }

  // Get services for appointments
  const allServices = await prisma.service.findMany({ orderBy: { order: 'asc' } });
  if (allServices.length === 0) {
    console.log('No services found, skipping appointments');
    return;
  }

  // Demo appointments
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setUTCDate(fiveDaysAgo.getUTCDate() - 5);

  const existingAppts = await prisma.appointment.count();
  if (existingAppts === 0) {
    // Today's confirmed bookings
    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[0]?.id,
        serviceId: allServices[0]?.id,
        date: today,
        startTime: '10:00',
        endTime: '10:45',
        price: allServices[0]?.price ?? 150000,
        status: 'confirmed',
      },
    });
    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[2]?.id,
        serviceId: allServices[1]?.id,
        date: today,
        startTime: '11:00',
        endTime: '12:00',
        price: allServices[1]?.price ?? 200000,
        status: 'confirmed',
      },
    });
    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[4]?.id,
        serviceId: allServices[2]?.id,
        date: today,
        startTime: '15:00',
        endTime: '15:30',
        price: allServices[2]?.price ?? 100000,
        status: 'confirmed',
      },
    });

    // Past completed
    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[1]?.id,
        serviceId: allServices[0]?.id,
        date: yesterday,
        startTime: '09:00',
        endTime: '09:45',
        price: allServices[0]?.price ?? 150000,
        status: 'completed',
        completedAt: yesterday,
      },
    });
    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[3]?.id,
        serviceId: allServices[5]?.id ?? allServices[0]?.id,
        date: twoDaysAgo,
        startTime: '14:00',
        endTime: '15:30',
        price: allServices[5]?.price ?? 280000,
        status: 'completed',
        completedAt: twoDaysAgo,
      },
    });
    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[5]?.id,
        serviceId: allServices[2]?.id,
        date: fiveDaysAgo,
        startTime: '11:00',
        endTime: '11:30',
        price: allServices[2]?.price ?? 100000,
        status: 'completed',
        completedAt: fiveDaysAgo,
      },
    });

    // Cancelled
    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[6]?.id,
        serviceId: allServices[0]?.id,
        date: yesterday,
        startTime: '16:00',
        endTime: '16:45',
        price: allServices[0]?.price ?? 150000,
        status: 'cancelled',
        cancellationReason: 'Shaxsiy sabab',
      },
    });

    // No-show
    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[8]?.id,
        serviceId: allServices[1]?.id,
        date: yesterday,
        startTime: '17:00',
        endTime: '18:00',
        price: allServices[1]?.price ?? 200000,
        status: 'no_show',
      },
    });
  }

  // Rebooking reminders
  const existingReminders = await prisma.rebookingReminder.count();
  if (existingReminders === 0 && createdCustomers.length >= 3) {
    const futureDate = new Date(today);
    futureDate.setUTCDate(futureDate.getUTCDate() + 5);
    const pastDate = new Date(today);
    pastDate.setUTCDate(pastDate.getUTCDate() - 2);

    const completedAppts = await prisma.appointment.findMany({ where: { status: 'completed' }, take: 3 });

    if (completedAppts.length >= 2) {
      await prisma.rebookingReminder.create({
        data: {
          customerId: completedAppts[0]?.customerId ?? createdCustomers[0]?.id,
          appointmentId: completedAppts[0]?.id,
          serviceId: completedAppts[0]?.serviceId,
          scheduledDate: futureDate,
          scheduledTime: '11:00',
          reminderDays: 20,
          status: 'scheduled',
        },
      });
      await prisma.rebookingReminder.create({
        data: {
          customerId: completedAppts[1]?.customerId ?? createdCustomers[1]?.id,
          appointmentId: completedAppts[1]?.id,
          serviceId: completedAppts[1]?.serviceId,
          scheduledDate: futureDate,
          scheduledTime: '11:00',
          reminderDays: 25,
          status: 'scheduled',
        },
      });
      await prisma.rebookingReminder.create({
        data: {
          customerId: completedAppts[0]?.customerId ?? createdCustomers[0]?.id,
          appointmentId: completedAppts[0]?.id,
          serviceId: completedAppts[0]?.serviceId,
          scheduledDate: pastDate,
          scheduledTime: '11:00',
          reminderDays: 20,
          status: 'sent',
          sentAt: pastDate,
        },
      });
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
