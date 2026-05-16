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

const FIRST_NAMES = ['Kamau', 'Njoroge', 'Wanjiku', 'Mwangi', 'Akinyi', 'Ochieng', 'Mutua', 'Kiprop', 'Nafula', 'Otieno', 'Wamalwa', 'Nyambura', 'Kariuki', 'Ondiek', 'Njeri', 'Kipchoge', 'Wekesa', 'Muthoni', 'Ouma', 'Cheruiyot', 'Macharia', 'Wambui', 'Ndung\'u', 'Kemboi', 'Atieno'];
const LAST_NAMES = ['Kenyatta', 'Odinga', 'Ruto', 'Ndolo', 'Omollo', 'Kiplagat', 'Waweru', 'Mbugua', 'Koech', 'Omino', 'Chebet', 'Karanja', 'Kiprono', 'Kiplimo', 'Makau', 'Nganga', 'Onyango', 'Odero', 'Korir', 'Kiptoo', 'Wanjala', 'Wabwire', 'Nyongesa', 'Mutiso', 'Kilonzo'];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate a random Kenyan phone number, e.g., 07XX XXX XXX or 01XX XXX XXX
const generateKenyanPhone = () => {
  const prefixes = ['070', '071', '072', '074', '075', '076', '079', '011', '010'];
  const prefix = getRandom(prefixes);
  const part1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const part2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix} ${part1} ${part2}`;
};

async function main() {
  console.log('1. Updating existing staff numbers and phone numbers...');
  const existingStaff = await prisma.staff.findMany();
  
  for (const staff of existingStaff) {
    let newStaffNumber = staff.staffNumber;
    if (newStaffNumber.startsWith('EMP')) {
      newStaffNumber = newStaffNumber.replace('EMP', 'MJK');
    }

    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        staffNumber: newStaffNumber,
        phoneNumber: generateKenyanPhone(),
      }
    });
  }
  console.log(`Updated ${existingStaff.length} existing records.`);

  console.log('2. Generating 50 new staff records...');
  // Find the highest existing MJK number to continue from there
  let nextIdNum = 1;
  const currentMjkStaff = await prisma.staff.findMany({
    where: { staffNumber: { startsWith: 'MJK' } },
  });
  
  currentMjkStaff.forEach(s => {
    const numMatch = s.staffNumber.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      if (num >= nextIdNum) {
        nextIdNum = num + 1;
      }
    }
  });

  const newStaffData = [];
  for (let i = 0; i < 50; i++) {
    const firstName = getRandom(FIRST_NAMES);
    const lastName = getRandom(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    
    const staffNumber = `MJK${nextIdNum.toString().padStart(3, '0')}`;
    nextIdNum++;

    newStaffData.push({
      name,
      staffNumber,
      phoneNumber: generateKenyanPhone(),
      location: getRandom(LOCATIONS),
      route: getRandom(ROUTES),
      currentShift: getRandom(SHIFTS),
      process: getRandom(PROCESSES),
      address: `${getRandom(['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'])} City`,
      pinLocation: null,
    });
  }

  const result = await prisma.staff.createMany({
    data: newStaffData,
  });

  console.log(`Successfully added ${result.count} new staff members.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
