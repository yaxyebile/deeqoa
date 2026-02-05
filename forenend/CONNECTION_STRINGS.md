# Halkee Connection String-yada la geliyo

## 1. MongoDB connection string (Backend)

**Halka loo isticmaalo:** `backend/src/config/db.js`  
**Env variable:** `MONGODB_URI`

**Halka lagu geliyo:**

- **Local:** samee `backend/.env` oo ku qor:
  ```env
  MONGODB_URI=mongodb://localhost:27017/deeqo
  ```
- **MongoDB Atlas (cloud):** ka copy connection string-ka Atlas (Connect → Drivers → Node.js), tusaale:
  ```env
  MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/deeqo?retryWrites=true&w=majority
  ```
- **Deploy (Railway, Render, etc.):** Project → Settings / Environment Variables → ku dar **MONGODB_URI** oo geli value-ka (Atlas link-ka).

---

## 2. Backend API URL (Frontend)

**Halka loo isticmaalo:** `forenend/lib/api.ts` – frontend wuxuu backend-ka la xiriiri karaa.  
**Env variable:** `NEXT_PUBLIC_API_URL`

**Halka lagu geliyo:**

- **Local:** samee `forenend/.env.local` oo ku qor (haddii backend-ka aad ku oranayso localhost):
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```
- **Vercel:** Project → Settings → Environment Variables → ku dar **NEXT_PUBLIC_API_URL** oo geli URL-ka backend-ka (tusaale: `https://deeqo-api.railway.app`).

---

## Database cusub: sidee “tables” (collections) loo helaa?

MongoDB ma leh tables – waxaa jira **collections** (users, buses, bookings, savedroutes). Waxay si automatic ah u soo baxaan marka data la galiyo.

**Kadib markaad connection string badasho (gaas/database cusub):**

1. Backend orod (`cd backend && npm run dev`).
2. Hal mar wici **seed** si super admin loo abuuro ee collection-ka `users` uu noqdo:
   ```bash
   curl -X POST http://localhost:3001/api/seed
   ```
   (Haddii backend-ku deploy yahay, beddelo URL-ka: `https://your-api.railway.app/api/seed`)
3. Collections-ka kale (buses, bookings, savedroutes) waxay si automatic ah u abuurmaan marka aad app-ka isticmaasho (login → migrate, ama bus/booking cusub).

**Super admin kadib seed:** email `admin@busbook.com`, password `admin123`.

---

## Soo koob

| Connection / URL   | Env variable            | Halka (local)        | Halka (deploy)              |
|--------------------|-------------------------|----------------------|-----------------------------|
| MongoDB            | `MONGODB_URI`           | `backend/.env`       | Railway/Render env vars     |
| Backend API (frontend) | `NEXT_PUBLIC_API_URL` | `forenend/.env.local` | Vercel env vars         |
