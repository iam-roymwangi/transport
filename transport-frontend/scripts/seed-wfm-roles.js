const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ROLES = ['Agent', 'Supervisor', 'QA', 'IT', 'OAM', 'OM'];

// Default shifts per role
const DEFAULT_ROLE_SHIFTS = {
  Agent: [
    { name: 'Evening Shift (Flexible)', shift: '17:00 - 02:00', isOvernight: true },
    { name: 'Midday Shift', shift: '12:00 - 21:00', isOvernight: false },
    { name: 'Afternoon Shift', shift: '13:00 - 21:30/22:00', isOvernight: false },
    { name: 'Late Afternoon', shift: '14:30/15:00 - 00:00', isOvernight: true },
    { name: 'Twilight Shift', shift: '16:00 - 01:00', isOvernight: true },
    { name: 'Night Shift', shift: '18:00 - 03:00', isOvernight: true },
    { name: 'Graveyard Shift', shift: '20:00 - 05:00', isOvernight: true },
    { name: 'Overnight Shift', shift: '23:00 - 08:00', isOvernight: true },
  ],
  Supervisor: [
    { name: 'Morning Supervision', shift: '08:00 - 17:00', isOvernight: false },
    { name: 'Day Supervision', shift: '10:00 - 19:00', isOvernight: false },
    { name: 'Late Shift Oversight', shift: '16:00 - 01:00', isOvernight: true },
    { name: 'Evening Supervision', shift: '17:00 - 02:00', isOvernight: true },
    { name: 'Night Supervision', shift: '23:00 - 08:00', isOvernight: true },
  ],
  QA: [
    { name: 'Standard QA Shift', shift: '09:00 - 18:00', isOvernight: false },
    { name: 'Mid QA Shift', shift: '13:00 - 22:00', isOvernight: false },
    { name: 'Late QA Monitoring', shift: '17:00 - 02:00', isOvernight: true },
  ],
  IT: [
    { name: 'Early IT Support', shift: '07:00 - 16:00', isOvernight: false },
    { name: 'Day IT Support', shift: '09:00 - 18:00', isOvernight: false },
    { name: 'Swing IT Support', shift: '15:00 - 00:00', isOvernight: true },
    { name: 'Night IT Systems', shift: '23:00 - 08:00', isOvernight: true },
  ],
  OAM: [
    { name: 'Core Management', shift: '08:00 - 17:00', isOvernight: false },
    { name: 'Partner Operations', shift: '10:00 - 19:00', isOvernight: false },
    { name: 'Executive Late', shift: '14:00 - 23:00', isOvernight: false },
  ],
  OM: [
    { name: 'General Operations', shift: '08:00 - 17:00', isOvernight: false },
    { name: 'Strategic Oversight', shift: '09:00 - 18:00', isOvernight: false },
    { name: 'Floor Oversight', shift: '12:00 - 21:00', isOvernight: false },
  ],
};

const SAMPLE_COORDS = [
  { lat: -1.2612, lng: 36.8044, area: 'Westlands / Westend Hub' },
  { lat: -1.2185, lng: 36.8864, area: 'Roysambu / Thika Road' },
  { lat: -1.2982, lng: 36.7865, area: 'Kilimani / Ngong Road' },
  { lat: -1.3124, lng: 36.8451, area: 'South B / Mombasa Road' },
  { lat: -1.2881, lng: 36.8772, area: 'Buruburu / Jogoo Road' },
  { lat: -1.2334, lng: 36.8450, area: 'Kiambu Road' },
  { lat: -1.2750, lng: 36.7950, area: 'Riverside Drive' },
  { lat: -1.2136, lng: 36.7978, area: 'Two Rivers' },
  { lat: -1.2667, lng: 36.8075, area: 'Delta Corner / Waiyaki' },
];

async function main() {
  console.log('Seeding ShiftConfigs...');
  const existingShiftCount = await prisma.shiftConfig.count();
  if (existingShiftCount === 0) {
    const shiftRecords = [];
    for (const [role, shifts] of Object.entries(DEFAULT_ROLE_SHIFTS)) {
      for (const s of shifts) {
        const parts = s.shift.split('-').map(p => p.trim());
        shiftRecords.push({
          role,
          name: s.name,
          startTime: parts[0] || '17:00',
          endTime: parts[1] || '02:00',
          shiftLabel: s.shift,
          isOvernight: !!s.isOvernight,
          isActive: true,
        });
      }
    }
    await prisma.shiftConfig.createMany({ data: shiftRecords });
    console.log(`Created ${shiftRecords.length} default shift configs.`);
  } else {
    console.log(`ShiftConfigs already exist (${existingShiftCount} records).`);
  }

  console.log('Updating sample staff with roles and coordinates...');
  const allStaff = await prisma.staff.findMany({ take: 30 });
  const roleDistribution = [
    'Agent', 'Agent', 'Agent', 'Agent', 'Supervisor',
    'Agent', 'Agent', 'QA', 'IT', 'Supervisor',
    'Agent', 'Agent', 'OAM', 'OM', 'Agent',
    'QA', 'IT', 'Agent', 'Agent', 'Supervisor',
  ];

  for (let i = 0; i < allStaff.length; i++) {
    const staff = allStaff[i];
    const role = roleDistribution[i % roleDistribution.length];
    const coord = SAMPLE_COORDS[i % SAMPLE_COORDS.length];
    const lat = coord.lat + (Math.random() - 0.5) * 0.01;
    const lng = coord.lng + (Math.random() - 0.5) * 0.01;
    const pin = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        role,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
        pinLocation: pin,
        googleMapsUrl: mapsUrl,
        address: staff.address || coord.area,
      },
    });
  }

  console.log(`Updated ${allStaff.length} staff members with roles and coordinates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
