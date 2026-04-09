require("dotenv").config();
const prisma = require("../src/config/db");

async function main() {
  const bookings = [
    {
      name: "John Doe",
      staffNumber: "EMP001",
      phoneNumber: "0712345678",
      location: "Nairobi CBD",
      route: "Route A",
      shift: "06:00 - 14:00",
      date: new Date("2026-04-10"),
      address: "123 Main St",
      process: "Morning",
    },
    {
      name: "Jane Smith",
      staffNumber: "EMP002",
      phoneNumber: "0798765432",
      location: "Westlands",
      route: "Route B",
      shift: "14:00 - 22:00",
      date: new Date("2026-04-10"),
      address: "456 Park Ave",
      process: "Afternoon",
    },
  ];

  for (const booking of bookings) {
    await prisma.booking.upsert({
      where: {
        staffNumber_date_shift: {
          staffNumber: booking.staffNumber,
          date: booking.date,
          shift: booking.shift,
        },
      },
      update: {},
      create: booking,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
