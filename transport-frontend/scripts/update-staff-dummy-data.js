const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LOCATIONS = ['Westend', 'Delta', 'Riverside', 'Two Rivers'];
const ROUTES = [
  'Jogoo Road', 'Thika Road', 'Ngong Road', 'Mombasa Road', 'Waiyaki Way',
  'Lower Kabete', 'Kiambu Road', 'Kamiti Road', 'Limuru Road',
];
const PROCESSES = ['BT', 'wynZ', 'BD', 'BT Safety', 'Vinted', 'Caption Call'];
const SHIFTS = [
  '12:00 - 21:00', '13:00 - 21:30/22:00', '13:30/14:00 - 23:00',
  '14:30/15:00 - 00:00', '15:30 - 00:30', '16:00 - 01:00',
  '16:30 - 01:30', '16:30/17:00 - 02:00', '18:00 - 03:00',
  '18:30/19:00 - 04:00', '20:00 - 05:00', '21:00 - 06:00',
  '21:30/22:00 - 07:00', '23:00 - 08:00', '00:00 - 09:00',
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log('Updating staff with realistic data...');
  const staffMembers = await prisma.staff.findMany();
  for (const staff of staffMembers) {
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        location: getRandom(LOCATIONS),
        route: getRandom(ROUTES),
        process: getRandom(PROCESSES),
        currentShift: getRandom(SHIFTS),
      }
    });
  }
  console.log('Successfully updated all staff members!');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
