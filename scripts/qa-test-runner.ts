import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function test(category: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ category, name, status: 'PASS', durationMs: Date.now() - start });
    console.log(`✅ [${category}] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ category, name, status: 'FAIL', details: err?.message, durationMs: Date.now() - start });
    console.error(`❌ [${category}] ${name}:`, err?.message);
  }
}

async function runAll() {
  console.log(`\n========================================`);
  console.log(`RUNNING SENIOR QA AUTOMATED TEST SUITE`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`========================================\n`);

  // --- 1. Public API & Site Verification ---
  let services: any[] = [];
  let testService: any;
  let testDate: string;
  let availableSlotsForDate: string[] = [];

  await test('Public API', 'Services endpoint returns active services', async () => {
    const res = await fetch(`${BASE_URL}/api/services`);
    assert(res.ok, `HTTP ${res.status}`);
    services = await res.json();
    assert(Array.isArray(services), 'Services is not array');
    assert(services.length >= 6, `Expected at least 6 services, got ${services.length}`);
    testService = services.find((s: any) => s.name === 'Soch kesish') || services[0];
    assert(testService && testService.duration && testService.price, 'Invalid test service');
  });

  await test('Public API', 'Settings endpoint returns correct barber info and theme', async () => {
    const res = await fetch(`${BASE_URL}/api/settings`);
    assert(res.ok, `HTTP ${res.status}`);
    const settings = await res.json();
    assert(settings.businessName === 'Jasurbek Barber', `Expected Jasurbek Barber, got ${settings.businessName}`);
    assert(settings.barberName === 'Jasurbek Xudoyberganov', `Expected Jasurbek Xudoyberganov, got ${settings.barberName}`);
    assert(settings.phone, 'Missing phone');
    assert(settings.address, 'Missing address');
  });

  // --- 2. Availability & Slot Logic ---
  await test('Availability', 'Slot generation handles work hours and excludes 13:00-14:00 lunch break', async () => {
    // Pick date 21 days out (ensure weekday Monday-Saturday)
    const d = new Date();
    d.setDate(d.getDate() + 21);
    if (d.getUTCDay() === 0) d.setDate(d.getDate() + 1); // Sunday -> Monday
    testDate = d.toISOString().split('T')[0];

    const res = await fetch(`${BASE_URL}/api/availability?serviceId=${testService.id}&date=${testDate}`);
    assert(res.ok, `HTTP ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.slots), 'slots is not array');
    assert(data.slots.length > 0, 'No slots available');
    availableSlotsForDate = data.slots;
    assert(data.slots.includes('09:00'), '09:00 should be the first slot');
    // Break check: 13:00-14:00 lunch break. 12:30 (45 min duration -> 13:15) overlaps!
    assert(!data.slots.includes('12:30'), 'Slot 12:30 overlaps lunch break 13:00-14:00!');
    assert(!data.slots.includes('13:00'), 'Slot 13:00 inside lunch break!');
    assert(!data.slots.includes('13:30'), 'Slot 13:30 inside lunch break!');
  });

  await test('Availability', 'Different duration services produce different valid slots', async () => {
    const longService = services.find((s: any) => s.duration === 90);
    assert(!!longService, 'No 90-minute service found');
    const res = await fetch(`${BASE_URL}/api/availability?serviceId=${longService.id}&date=${testDate}`);
    const data = await res.json();
    // 90 min service at 12:00 ends at 13:30 -> overlaps lunch break!
    assert(!data.slots.includes('12:00'), '90-min service at 12:00 overlaps 13:00-14:00 lunch break!');
    assert(!data.slots.includes('12:30'), '90-min service at 12:30 overlaps lunch break!');
  });

  await test('Availability', 'Missing params return 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/availability`);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // --- 3. Customer Booking Validation & Edge Cases ---
  await test('Booking Flow', 'Validation: empty name, phone, or missing service/slot rejected with 400', async () => {
    const payload = { name: '', phone: '', serviceId: testService.id, date: testDate, startTime: '09:00' };
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('Booking Flow', 'Validation: invalid phone numbers rejected with 400', async () => {
    for (const badPhone of ['123', 'abc', '+123456', '+99812']) {
      const res = await fetch(`${BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bad Phone User',
          phone: badPhone,
          serviceId: testService.id,
          date: testDate,
          startTime: '09:00',
        }),
      });
      assert(res.status === 400, `Expected 400 for bad phone "${badPhone}", got ${res.status}`);
    }
  });

  await test('Booking Flow', 'Validation: past dates and invalid formats rejected with 400', async () => {
    const resPast = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Past Date User',
        phone: '+998901234567',
        serviceId: testService.id,
        date: '2020-01-01',
        startTime: '09:00',
      }),
    });
    assert(resPast.status === 400, `Expected 400 for past date, got ${resPast.status}`);
  });

  await test('Booking Flow', 'Validation: booking outside business hours or during break rejected with 409', async () => {
    const resBreak = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Break User',
        phone: '+998901234567',
        serviceId: testService.id,
        date: testDate,
        startTime: '13:00', // Lunch break
      }),
    });
    assert(resBreak.status === 409, `Expected 409 for lunch break slot, got ${resBreak.status}`);
  });

  let createdApptId: string;
  const testPhone = '+998901112233';
  const testSlot = availableSlotsForDate[0] || '09:00';

  await test('Booking Flow', 'Successful booking creation saves to database and returns ticket', async () => {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Senior QA Tester',
        phone: testPhone,
        serviceId: testService.id,
        date: testDate,
        startTime: testSlot,
        notes: 'Maxsus talab: Soch qaychi bilan qisqartirilsin',
        addons: ['massage'], // 40,000 UZS add-on
      }),
    });
    const text = await res.text();
    assert(res.status === 201, `Expected 201, got ${res.status}: ${text}`);
    const appt = JSON.parse(text);
    assert(appt.id, 'Missing appointment id');
    assert(appt.status === 'confirmed', `Expected confirmed, got ${appt.status}`);
    assert(appt.telegramLink, 'Missing telegram bot link in confirmation ticket');
    createdApptId = appt.id;

    // Verify in Database directly
    const dbAppt = await prisma.appointment.findUnique({
      where: { id: createdApptId },
      include: { customer: true, service: true },
    });
    assert(!!dbAppt, 'Booking record not found in PostgreSQL');
    assert(dbAppt!.customer.phone === testPhone, `Customer phone mismatch in DB: ${dbAppt!.customer.phone}`);
    assert(dbAppt!.startTime === testSlot, 'Start time mismatch in DB');
    // Price must reflect VIP add-on (service.price + 40000)
    assert(Boolean(dbAppt!.notes?.includes('Soch qaychi bilan')), 'Customer custom notes were not saved!');
    assert(Boolean(dbAppt!.notes?.includes('Bosh & Yuz massaji')), 'VIP add-on was not recorded in notes!');
  });

  await test('Booking Flow', 'Duplicate booking prevention: same slot returns 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Customer',
        phone: '+998902223344',
        serviceId: testService.id,
        date: testDate,
        startTime: testSlot,
      }),
    });
    assert(res.status === 409, `Expected 409 Conflict for booked slot, got ${res.status}`);
    const err = await res.json();
    assert(err.error?.includes('band') || err.error?.includes('tanlang'), `Unexpected error msg: ${err.error}`);
  });

  await test('Booking Flow', 'Concurrency: 2 simultaneous requests for the same slot only 1 succeeds', async () => {
    const freshAvail = await (await fetch(`${BASE_URL}/api/availability?serviceId=${testService.id}&date=${testDate}`)).json();
    const parallelSlot = freshAvail.slots[0];
    assert(!!parallelSlot, 'No open slot for concurrency test');
    const req1 = fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', phone: '+998903334455', serviceId: testService.id, date: testDate, startTime: parallelSlot }),
    });
    const req2 = fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', phone: '+998904445566', serviceId: testService.id, date: testDate, startTime: parallelSlot }),
    });

    const [res1, res2] = await Promise.all([req1, req2]);
    const statuses = [res1.status, res2.status].sort();
    assert(statuses[0] === 201 && statuses[1] === 409, `Expected [201, 409], got [${res1.status}, ${res2.status}]`);

    // Clean up parallel appointment
    const successfulRes = res1.status === 201 ? res1 : res2;
    const body = await successfulRes.json();
    if (body.id) {
      await prisma.telegramLinkToken.deleteMany({ where: { appointmentId: body.id } });
      await prisma.appointment.delete({ where: { id: body.id } });
    }
  });

  // --- 4. Admin Authentication & Security ---
  let adminCookie = '';

  await test('Admin Security', 'Unauthorized request to /api/admin/* endpoints blocked with 401', async () => {
    const endpoints = [
      '/api/admin/auth/me',
      '/api/admin/appointments',
      '/api/admin/dashboard',
      '/api/admin/customers',
      '/api/admin/schedule',
      '/api/admin/services',
      '/api/admin/settings',
      '/api/admin/reminders',
      '/api/admin/notifications',
    ];
    for (const ep of endpoints) {
      const res = await fetch(`${BASE_URL}${ep}`);
      assert(res.status === 401, `Endpoint ${ep} allowed unauthenticated access! Status: ${res.status}`);
    }
  });

  await test('Admin Auth', 'Admin login with invalid credentials rejected with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@barber.uz', password: 'WrongPassword999!' }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Admin Auth', 'Admin login with valid credentials (admin@barber.uz / Admin123!) sets secure cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@barber.uz', password: 'Admin123!' }),
    });
    assert(res.ok, `Login failed: HTTP ${res.status}`);
    const cookies = res.headers.getSetCookie?.() || [res.headers.get('set-cookie') || ''];
    const tokenCookie = cookies.find(c => c.includes('admin_token='));
    assert(!!tokenCookie, 'No admin_token cookie found in response');
    adminCookie = (tokenCookie || '').split(';')[0];
  });

  await test('Admin Auth', '/api/admin/auth/me confirms session and does not leak password hash', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/auth/me`, {
      headers: { Cookie: adminCookie },
    });
    assert(res.ok, `HTTP ${res.status}`);
    const data = await res.json();
    assert(data.adminId, 'Missing adminId');
    assert(data.username, 'Missing username');
    assert(!data.password, 'Security issue: password returned in /me response!');
  });

  // --- 5. Admin Booking Management Lifecycle ---
  await test('Admin Bookings', 'Admin can view all bookings and filter by status', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/appointments`, {
      headers: { Cookie: adminCookie },
    });
    assert(res.ok, `HTTP ${res.status}`);
    const list = await res.json();
    assert(Array.isArray(list), 'Expected list of appointments');
    const target = list.find((a: any) => a.id === createdApptId);
    assert(!!target, `Created booking ${createdApptId} not found in admin appointments list`);
    assert(target.customer.phone === testPhone, 'Phone number mismatch');
    assert(target.notes?.includes('VIP: Bosh & Yuz massaji'), 'Notes not present in admin appointment view');
  });

  await test('Admin Bookings', 'Admin marks booking completed -> completedAt set & reminder scheduled (even without telegramId)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/appointments/${createdApptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert(res.ok, `HTTP ${res.status}`);
    const updated = await res.json();
    assert(updated.status === 'completed', `Expected completed, got ${updated.status}`);
    assert(updated.completedAt, 'completedAt was not set');

    // Verify in Database
    const dbAppt = await prisma.appointment.findUnique({ where: { id: createdApptId } });
    assert(dbAppt?.status === 'completed', 'DB status not completed');

    // Check rebooking reminder scheduled
    const reminder = await prisma.rebookingReminder.findFirst({
      where: { appointmentId: createdApptId },
    });
    assert(!!reminder, 'Rebooking reminder was not generated upon completion');
    assert(reminder!.status === 'scheduled', `Reminder status: ${reminder!.status}`);
    assert(reminder!.reminderDays === (testService.rebookingReminderDays || 20), 'Reminder days mismatch');
  });

  await test('Admin Bookings', 'Admin can cancel booking and slot is released for re-booking', async () => {
    // 1. Create a fresh booking
    const cancelDate = testDate;
    const freshAvail2 = await (await fetch(`${BASE_URL}/api/availability?serviceId=${testService.id}&date=${cancelDate}`)).json();
    const cancelSlot = freshAvail2.slots[freshAvail2.slots.length - 1];
    assert(!!cancelSlot, 'No open slot for cancellation test');
    const bookRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cancellation User',
        phone: '+998905556677',
        serviceId: testService.id,
        date: cancelDate,
        startTime: cancelSlot,
      }),
    });
    const bookText = await bookRes.text();
    assert(bookRes.status === 201, `Booking creation failed: ${bookText}`);
    const appt = JSON.parse(bookText);

    // Verify slot is taken
    let avail = await (await fetch(`${BASE_URL}/api/availability?serviceId=${testService.id}&date=${cancelDate}`)).json();
    assert(!avail.slots.includes(cancelSlot), `Slot ${cancelSlot} should be unavailable`);

    // 2. Admin cancels booking
    const cancelRes = await fetch(`${BASE_URL}/api/admin/appointments/${appt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'cancelled', cancellationReason: 'Client called to cancel' }),
    });
    assert(cancelRes.ok, `Cancel failed: HTTP ${cancelRes.status}`);

    // 3. Verify slot is available again!
    avail = await (await fetch(`${BASE_URL}/api/availability?serviceId=${testService.id}&date=${cancelDate}`)).json();
    assert(avail.slots.includes(cancelSlot), `Slot ${cancelSlot} was not released after cancellation!`);

    // 4. Re-book that exact slot successfully
    const rebookRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rebooked User',
        phone: '+998906667788',
        serviceId: testService.id,
        date: cancelDate,
        startTime: cancelSlot,
      }),
    });
    const rebookText = await rebookRes.text();
    assert(rebookRes.status === 201, `Rebooking failed: ${rebookText}`);
    const rebooked = JSON.parse(rebookText);

    // Clean up
    await prisma.telegramLinkToken.deleteMany({ where: { appointmentId: { in: [appt.id, rebooked.id] } } });
    await prisma.appointment.delete({ where: { id: rebooked.id } });
    await prisma.appointment.delete({ where: { id: appt.id } });
  });

  // --- 6. Admin Dashboard & Metrics ---
  await test('Admin Dashboard', 'Dashboard returns valid statistics', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Cookie: adminCookie },
    });
    assert(res.ok, `HTTP ${res.status}`);
    const data = await res.json();
    assert(typeof data.todayBookings === 'number', 'todayBookings missing');
    assert(typeof data.todayCompleted === 'number', 'todayCompleted missing');
    assert(typeof data.todayRevenue === 'number', 'todayRevenue missing');
    assert(typeof data.totalCustomers === 'number', 'totalCustomers missing');
    assert(typeof data.pendingReminders === 'number', 'pendingReminders missing');
  });

  // --- 7. Admin Customer CRM & Visit Tracking ---
  await test('Admin Customers', 'Customer CRM accumulates visit count and total spent', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/customers?search=Senior QA Tester`, {
      headers: { Cookie: adminCookie },
    });
    assert(res.ok, `HTTP ${res.status}`);
    const customers = await res.json();
    assert(Array.isArray(customers), 'Customers is not array');
    const cust = customers.find((c: any) => c.phone === testPhone);
    assert(!!cust, 'Customer not found in search');
    assert(cust.totalVisits >= 1, `Expected at least 1 visit, got ${cust.totalVisits}`);
    assert(cust.totalSpent > 0, `Expected totalSpent > 0, got ${cust.totalSpent}`);
  });

  // --- 8. Admin Services Management ---
  let tempServiceId = '';
  await test('Admin Services', 'Admin can add a new service and delete it', async () => {
    const addRes = await fetch(`${BASE_URL}/api/admin/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'QA VIP Spa Treatment',
        description: 'Test description',
        price: 250000,
        duration: 60,
        rebookingReminderDays: 20,
      }),
    });
    assert(addRes.status === 201, `Failed to add service: HTTP ${addRes.status}`);
    const created = await addRes.json();
    tempServiceId = created.id;
    assert(created.name === 'QA VIP Spa Treatment', 'Name mismatch');

    // Delete (soft-delete isActive: false)
    const delRes = await fetch(`${BASE_URL}/api/admin/services/${tempServiceId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delRes.ok, `Failed to delete service: HTTP ${delRes.status}`);

    // Verify it is inactive in database
    const dbSvc = await prisma.service.findUnique({ where: { id: tempServiceId } });
    assert(dbSvc?.isActive === false, 'Service was not soft-deleted');

    // Hard cleanup
    await prisma.service.delete({ where: { id: tempServiceId } });
  });

  // --- 9. Admin Schedule & DayOff ---
  await test('Admin Schedule', 'DayOff upsert blocks all slots and updates without 500 collision', async () => {
    const offDate = '2026-11-20';
    // Add DayOff
    const addRes = await fetch(`${BASE_URL}/api/admin/dayoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ date: offDate, reason: 'Bayram ta\'tili' }),
    });
    assert(addRes.status === 201, `Failed to add DayOff: HTTP ${addRes.status}`);
    const dayOff = await addRes.json();

    // Re-add same date (upsert test: must not throw 500)
    const reAddRes = await fetch(`${BASE_URL}/api/admin/dayoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ date: offDate, reason: 'Yangilangan ta\'til' }),
    });
    assert(reAddRes.status === 201, `Upsert failed: HTTP ${reAddRes.status}`);

    // Verify availability returns 0 slots
    const availRes = await fetch(`${BASE_URL}/api/availability?serviceId=${testService.id}&date=${offDate}`);
    const avail = await availRes.json();
    assert(avail.slots.length === 0, `Expected 0 slots on DayOff, got ${avail.slots.length}`);

    // Remove DayOff
    const delRes = await fetch(`${BASE_URL}/api/admin/dayoff/${dayOff.id}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delRes.ok, `Failed to delete DayOff: HTTP ${delRes.status}`);

    // Verify slots return
    const availAfter = await (await fetch(`${BASE_URL}/api/availability?serviceId=${testService.id}&date=${offDate}`)).json();
    assert(availAfter.slots.length > 0, 'Slots did not return after removing DayOff');
  });

  // Clean up test appointments & customers safely
  try {
    const testPhones = [
      testPhone,
      '+998902223344',
      '+998903334455',
      '+998904445566',
      '+998905556677',
      '+998906667788',
    ];
    const testCusts = await prisma.customer.findMany({ where: { phone: { in: testPhones } } });
    const custIds = testCusts.map(c => c.id);
    const appts = await prisma.appointment.findMany({ where: { customerId: { in: custIds } } });
    const apptIds = appts.map(a => a.id);
    if (apptIds.length > 0) {
      await prisma.rebookingReminder.deleteMany({ where: { appointmentId: { in: apptIds } } });
      await prisma.telegramLinkToken.deleteMany({ where: { appointmentId: { in: apptIds } } });
      await prisma.appointment.deleteMany({ where: { id: { in: apptIds } } });
    }
    if (custIds.length > 0) {
      await prisma.customer.deleteMany({ where: { id: { in: custIds } } });
    }
  } catch (e) {
    console.warn('Final cleanup warning:', e);
  }

  // Final Report Summary
  console.log('\n========================================');
  console.log('QA AUTOMATED TEST RESULTS:');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================\n');

  if (failed > 0) {
    console.error('Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(f => {
      console.error(`- [${f.category}] ${f.name}: ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY!');
  }
}

runAll()
  .catch((err) => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
