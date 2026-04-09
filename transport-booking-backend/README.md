# Transport Booking Backend

Express + Prisma + Neon PostgreSQL backend for processing Microsoft Forms transport bookings.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Neon Database
1. Create a free account at https://neon.tech
2. Create a new project (e.g. "transport-booking")
3. Copy the connection string from the dashboard
4. Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
PORT=3001
```

### 3. Push schema and generate client
```bash
npx prisma db push
npx prisma generate
```

### 4. (Optional) Seed sample data
```bash
npm run db:seed
```

### 5. Start the server
```bash
npm run dev   # development
npm start     # production
```

---

## API Reference

### Health Check
```
GET /health
```

### Import Excel Bookings
```
POST /import-bookings
Content-Type: multipart/form-data
Body: file (Excel .xlsx from Microsoft Forms export)

Response:
{
  "success": true,
  "inserted": 42,
  "duplicates": [{ "staffNumber": "EMP001", "date": "...", "shift": "..." }]
}
```

### Create Single Booking
```
POST /bookings
Content-Type: application/json
{
  "name": "John Doe",
  "staffNumber": "EMP001",
  "phoneNumber": "0712345678",
  "location": "Nairobi CBD",
  "route": "Route A",
  "shift": "06:00 - 14:00",
  "date": "2026-04-10",
  "address": "123 Main St",
  "process": "Morning"
}
```

### Get Bookings by Date
```
GET /bookings?date=2026-04-10

Response:
{
  "date": "2026-04-10",
  "shifts": {
    "06:00 - 14:00": [...],
    "14:00 - 22:00": [...]
  }
}
```

### Summary by Date
```
GET /summary?date=2026-04-10

Response:
{
  "date": "2026-04-10",
  "total": 25,
  "byShift": { "06:00 - 14:00": 12, "14:00 - 22:00": 13 },
  "byLocation": { "Nairobi CBD": 10, "Westlands": 15 }
}
```

---

## Excel Column Mapping (Microsoft Forms)

| Form Field            | Database Field  |
|-----------------------|-----------------|
| Name                  | name            |
| Staff Number          | staffNumber     |
| Phone Number          | phoneNumber     |
| Location              | location        |
| Route                 | route           |
| Pickup/Dropoff time   | shift           |
| Pickup/Dropoff date   | date            |
| Address               | address         |
| Process               | process         |
