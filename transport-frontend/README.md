# Transport Booking Dashboard

Full-stack Next.js app — dashboard + API routes + Prisma + Neon PostgreSQL.  
Ready for one-click Vercel deployment.

---

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Neon database
1. Create a free account at https://neon.tech
2. Create a project (e.g. "transport-booking")
3. Go to **Connection Details** and copy both URLs
4. Create `.env.local`:

```env
# Pooled connection (used at runtime by Prisma)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"

# Direct connection (used by prisma db push / migrations)
DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

### 3. Push schema & generate client
```bash
npx prisma db push
npx prisma generate
```

### 4. Run dev server
```bash
npm run dev
```

Open http://localhost:3000

---

## Vercel Deployment

1. Push this folder to a GitHub repo
2. Import the repo in https://vercel.com/new
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` — pooled Neon connection string
   - `DIRECT_URL` — direct Neon connection string
4. Deploy — Vercel runs `prisma generate && next build` automatically

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/bookings?date=YYYY-MM-DD` | Get bookings for a date (flat array) |
| POST | `/api/bookings` | Create a single booking |
| GET | `/api/summary?date=YYYY-MM-DD` | Stats: total, byShift, byLocation |
| POST | `/api/import-bookings` | Upload Excel file (multipart, field: `file`) |

---

## Pages

| Path | Description |
|------|-------------|
| `/` | Main dashboard — date picker, stats, bookings by shift |
| `/import` | Excel import page with drag-and-drop |
