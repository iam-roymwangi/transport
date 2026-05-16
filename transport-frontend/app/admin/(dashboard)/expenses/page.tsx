import { PrismaClient } from '@prisma/client';
import { ExpensesDashboard } from './expenses-dashboard';

const prisma = new PrismaClient();
export const revalidate = 0;

// ─── Distance lookup table (dummy distances in km) ─────────────────────────
// Key format: "Location → Route"
const DISTANCE_TABLE: Record<string, number> = {
  'Westend → Jogoo Road': 14.2,
  'Westend → Thika Road': 18.5,
  'Westend → Ngong Road': 9.8,
  'Westend → Mombasa Road': 22.1,
  'Westend → Waiyaki Way': 5.3,
  'Westend → Lower Kabete': 11.4,
  'Westend → Kiambu Road': 19.7,
  'Westend → Kamiti Road': 24.3,
  'Westend → Limuru Road': 28.6,

  'Delta → Jogoo Road': 11.8,
  'Delta → Thika Road': 15.2,
  'Delta → Ngong Road': 17.4,
  'Delta → Mombasa Road': 19.6,
  'Delta → Waiyaki Way': 8.9,
  'Delta → Lower Kabete': 13.5,
  'Delta → Kiambu Road': 22.1,
  'Delta → Kamiti Road': 20.8,
  'Delta → Limuru Road': 25.3,

  'Riverside → Jogoo Road': 9.4,
  'Riverside → Thika Road': 12.7,
  'Riverside → Ngong Road': 13.1,
  'Riverside → Mombasa Road': 16.8,
  'Riverside → Waiyaki Way': 6.2,
  'Riverside → Lower Kabete': 8.9,
  'Riverside → Kiambu Road': 18.4,
  'Riverside → Kamiti Road': 17.5,
  'Riverside → Limuru Road': 21.7,

  'Two Rivers → Jogoo Road': 16.3,
  'Two Rivers → Thika Road': 20.1,
  'Two Rivers → Ngong Road': 21.8,
  'Two Rivers → Mombasa Road': 28.4,
  'Two Rivers → Waiyaki Way': 12.6,
  'Two Rivers → Lower Kabete': 7.3,
  'Two Rivers → Kiambu Road': 14.9,
  'Two Rivers → Kamiti Road': 19.2,
  'Two Rivers → Limuru Road': 18.5,
};

// Rate per km in KES
const RATE_PER_KM = 35;

function getDistance(location: string, route: string): number {
  const key = `${location} → ${route}`;
  return DISTANCE_TABLE[key] ?? 12; // default 12km if not found
}

export default async function ExpensesPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { date: 'desc' },
  });

  // Enrich bookings with cost data
  const enriched = bookings.map((b) => {
    const routes = b.route ? b.route.split(', ') : [];
    const primaryRoute = routes[0] || '';
    const distance = getDistance(b.location || '', primaryRoute);
    const cost = Math.round(distance * RATE_PER_KM);
    return { ...b, distance, cost, primaryRoute };
  });

  return <ExpensesDashboard bookings={enriched} ratePerKm={RATE_PER_KM} />;
}
