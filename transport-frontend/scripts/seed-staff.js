const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dummyStaff = [
  {
    name: 'Alice Johnson',
    staffNumber: 'EMP001',
    phoneNumber: '+1-555-0101',
    location: 'North Wing',
    currentShift: 'Morning',
    process: 'Assembly',
    route: 'Route A',
    address: '123 Maple St, Springfield',
    pinLocation: '40.7128,-74.0060',
  },
  {
    name: 'Bob Smith',
    staffNumber: 'EMP002',
    phoneNumber: '+1-555-0102',
    location: 'South Wing',
    currentShift: 'Evening',
    process: 'Packaging',
    route: 'Route B',
    address: '456 Oak Ave, Springfield',
    pinLocation: '40.7138,-74.0070',
  },
  {
    name: 'Charlie Davis',
    staffNumber: 'EMP003',
    phoneNumber: '+1-555-0103',
    location: 'East Wing',
    currentShift: 'Night',
    process: 'Logistics',
    route: 'Route C',
    address: '789 Pine Rd, Springfield',
    pinLocation: '40.7148,-74.0080',
  },
  {
    name: 'Diana Evans',
    staffNumber: 'EMP004',
    phoneNumber: '+1-555-0104',
    location: 'West Wing',
    currentShift: 'Morning',
    process: 'QA',
    route: 'Route A',
    address: '321 Elm St, Springfield',
    pinLocation: '40.7158,-74.0090',
  },
  {
    name: 'Ethan Foster',
    staffNumber: 'EMP005',
    phoneNumber: '+1-555-0105',
    location: 'North Wing',
    currentShift: 'Evening',
    process: 'Assembly',
    route: 'Route D',
    address: '654 Birch Blvd, Springfield',
    pinLocation: '40.7168,-74.0100',
  },
  {
    name: 'Fiona Green',
    staffNumber: 'EMP006',
    phoneNumber: '+1-555-0106',
    location: 'South Wing',
    currentShift: 'Night',
    process: 'Packaging',
    route: 'Route B',
    address: '987 Cedar Ln, Springfield',
    pinLocation: '40.7178,-74.0110',
  },
  {
    name: 'George Harris',
    staffNumber: 'EMP007',
    phoneNumber: '+1-555-0107',
    location: 'East Wing',
    currentShift: 'Morning',
    process: 'Logistics',
    route: 'Route C',
    address: '147 Walnut St, Springfield',
    pinLocation: '40.7188,-74.0120',
  },
  {
    name: 'Hannah Irving',
    staffNumber: 'EMP008',
    phoneNumber: '+1-555-0108',
    location: 'West Wing',
    currentShift: 'Evening',
    process: 'QA',
    route: 'Route A',
    address: '258 Chestnut Ave, Springfield',
    pinLocation: '40.7198,-74.0130',
  },
  {
    name: 'Ian Jones',
    staffNumber: 'EMP009',
    phoneNumber: '+1-555-0109',
    location: 'North Wing',
    currentShift: 'Night',
    process: 'Assembly',
    route: 'Route D',
    address: '369 Spruce Rd, Springfield',
    pinLocation: '40.7208,-74.0140',
  },
  {
    name: 'Julia King',
    staffNumber: 'EMP010',
    phoneNumber: '+1-555-0110',
    location: 'South Wing',
    currentShift: 'Morning',
    process: 'Packaging',
    route: 'Route B',
    address: '159 Ash St, Springfield',
    pinLocation: '40.7218,-74.0150',
  }
];

async function main() {
  console.log('Start seeding staff...');
  for (const staff of dummyStaff) {
    const existing = await prisma.staff.findUnique({
      where: { staffNumber: staff.staffNumber },
    });
    if (!existing) {
      await prisma.staff.create({ data: staff });
      console.log(`Created staff: ${staff.staffNumber} - ${staff.name}`);
    } else {
      console.log(`Staff already exists: ${staff.staffNumber}`);
    }
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
