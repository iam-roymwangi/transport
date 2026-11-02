const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SAMPLE_VEHICLES = [
  {
    plateNumber: 'KDA 219B',
    model: 'Toyota Fielder (5-Seater)',
    capacity: 5,
    driverName: 'John Mwangi',
    driverPhone: '0722 123 456',
    status: 'AVAILABLE',
  },
  {
    plateNumber: 'KDB 540C',
    model: 'Toyota Axio (5-Seater)',
    capacity: 5,
    driverName: 'Peter Otieno',
    driverPhone: '0733 234 567',
    status: 'AVAILABLE',
  },
  {
    plateNumber: 'KDC 112E',
    model: 'Toyota Noah (7-Seater)',
    capacity: 7,
    driverName: 'James Kiprono',
    driverPhone: '0711 345 678',
    status: 'AVAILABLE',
  },
  {
    plateNumber: 'KDD 831F',
    model: 'Toyota Voxy (7-Seater)',
    capacity: 7,
    driverName: 'David Ochieng',
    driverPhone: '0722 456 789',
    status: 'AVAILABLE',
  },
  {
    plateNumber: 'KDE 405G',
    model: 'Toyota HiAce Mini (9-Seater)',
    capacity: 9,
    driverName: 'Samuel Kariuki',
    driverPhone: '0799 567 890',
    status: 'AVAILABLE',
  },
  {
    plateNumber: 'KDF 778H',
    model: 'Toyota HiAce Van (14-Seater)',
    capacity: 14,
    driverName: 'Boniface Mutua',
    driverPhone: '0700 678 901',
    status: 'AVAILABLE',
  },
  {
    plateNumber: 'KDG 992J',
    model: 'Nissan Caravan Van (14-Seater)',
    capacity: 14,
    driverName: 'Evans Wanjala',
    driverPhone: '0715 789 012',
    status: 'AVAILABLE',
  },
  {
    plateNumber: 'KDH 315K',
    model: 'Toyota HiAce Van (14-Seater)',
    capacity: 14,
    driverName: 'Joseph Njoroge',
    driverPhone: '0728 890 123',
    status: 'AVAILABLE',
  },
];

const CAMPAIGNS = [
  {
    name: 'Caption Call',
    defaultRestDays: [5, 6], // Fri, Sat
    allowedRestDays: [5, 6, 0, 1], // Friday to Monday
    workingDaysCount: 5,
    restDaysCount: 2,
    notes: 'Rest days range from Friday to Monday. Standard 2 rest days per week.',
  },
  {
    name: 'BT',
    defaultRestDays: [6, 0], // Sat, Sun
    allowedRestDays: [5, 6, 0, 1],
    workingDaysCount: 5,
    restDaysCount: 2,
    notes: 'Standard weekend rest days.',
  },
  {
    name: 'wynZ',
    defaultRestDays: [6, 0],
    allowedRestDays: [5, 6, 0, 1],
    workingDaysCount: 5,
    restDaysCount: 2,
    notes: 'Operations weekend schedule.',
  },
  {
    name: 'BD',
    defaultRestDays: [0, 1], // Sun, Mon
    allowedRestDays: [5, 6, 0, 1],
    workingDaysCount: 5,
    restDaysCount: 2,
    notes: 'Sunday and Monday rotation.',
  },
  {
    name: 'BT Safety',
    defaultRestDays: [6, 0],
    allowedRestDays: [5, 6, 0, 1],
    workingDaysCount: 5,
    restDaysCount: 2,
    notes: 'Continuous safety monitor shift rotation.',
  },
  {
    name: 'Vinted',
    defaultRestDays: [5, 6],
    allowedRestDays: [5, 6, 0, 1],
    workingDaysCount: 5,
    restDaysCount: 2,
    notes: 'Friday and Saturday rest days.',
  },
];

async function main() {
  console.log('1. Assigning 7-digit BMS numbers to all staff...');
  const allStaff = await prisma.staff.findMany({ orderBy: { createdAt: 'asc' } });
  let bmsBase = 6142710;

  for (let i = 0; i < allStaff.length; i++) {
    const s = allStaff[i];
    const bmsNumber = String(bmsBase + i);
    await prisma.staff.update({
      where: { id: s.id },
      data: { bmsNumber },
    });
  }
  console.log(`Updated ${allStaff.length} staff records with unique 7-digit BMS numbers.`);

  console.log('2. Syncing BMS numbers to existing bookings...');
  const allBookings = await prisma.booking.findMany();
  for (const b of allBookings) {
    const staff = await prisma.staff.findUnique({ where: { staffNumber: b.staffNumber } });
    if (staff && staff.bmsNumber) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { bmsNumber: staff.bmsNumber },
      });
    }
  }
  console.log(`Synced BMS numbers to ${allBookings.length} bookings.`);

  console.log('3. Seeding fleet vehicles (5-seater to 14-seater van)...');
  for (const v of SAMPLE_VEHICLES) {
    await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: v,
      create: v,
    });
  }
  console.log(`Seeded ${SAMPLE_VEHICLES.length} vehicles.`);

  console.log('4. Seeding Campaign Configurations...');
  for (const c of CAMPAIGNS) {
    await prisma.campaignConfig.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    });
  }
  console.log(`Seeded ${CAMPAIGNS.length} campaigns.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
