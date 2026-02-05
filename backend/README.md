# Deeqo Backend

Node.js + Express + MongoDB backend for the Deeqo bus booking app.

## Setup

1. **MongoDB**: Ensure MongoDB is running locally (e.g. `mongod`) and the database `deeqo` is available at `mongodb://localhost:27017/deeqo`.

2. **Install and run**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Server runs at `http://localhost:3001`.

## Environment

- `PORT` – Server port (default: 3001)
- `MONGODB_URI` – MongoDB connection string (default: `mongodb://localhost:27017/deeqo`)

## Database cusub (connection string la beddelay)

MongoDB ma leh "tables" – waxaa jira **collections** oo si automatic ah loo abuuraya marka data la galiyo.

**Kadib markaad connection string u beddesho (database cusub):**

1. **Backend orod:** `npm run dev` (ama `npm start`).
2. **Seed / init:** wici endpoint-kan hal mar:
   ```bash
   curl -X POST http://localhost:3001/api/seed
   ```
   Tani waxay abuuraan super admin (email: `admin@busbook.com`, password: `admin123`) ee database-ka cusub.
3. **Collections-ka kale** (buses, bookings, savedroutes) waxay si automatic ah u soo baxaan marka aad app-ka isticmaasho (migrate ama API) – uma baahnid inaad manual ku abuurto.

## API

- `GET/POST /api/users` – List / create users
- `GET /api/users/email?email=...` – User by email
- `GET/PATCH/DELETE /api/users/:id` – User by ID
- `GET/PATCH /api/users/:id/status` – Update user status
- `GET /api/users/pending-admins` – Pending bus admins
- `GET/POST /api/buses` – List / create buses (query: `from`, `to`, `date`)
- `GET/PATCH/DELETE /api/buses/:id` – Bus by ID
- `GET /api/buses/admin/:adminId` – Buses by admin
- `GET/POST /api/bookings` – List / create bookings
- `GET/PATCH/DELETE /api/bookings/:id` – Booking by ID
- `GET /api/bookings/user/:userId` – Bookings by user
- `GET /api/bookings/bus/:busId` – Bookings by bus
- `GET /api/bookings/bus/:busId/booked-seats` – Booked seat numbers
- `PATCH /api/bookings/:id/status` – Update booking status
- `POST /api/bookings/:id/cancel` – Cancel booking (returns refund info)
- `GET/POST /api/saved-routes` – List / create saved routes
- `GET /api/saved-routes/user/:userId` – Saved routes by user
- `DELETE /api/saved-routes/:id` – Delete saved route
- `POST /api/migrate` – Migrate localStorage payload to MongoDB (body: `{ users, buses, bookings, savedRoutes }`)
- `POST /api/seed` – Seed database (create super admin in new DB; call once after changing connection string)
- `GET /api/stats` – Dashboard stats
- `GET /api/health` – Health check
