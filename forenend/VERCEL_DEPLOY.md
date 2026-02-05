# Deploy Deeqo (BusBook) on Vercel

## 1. Repo u gudbi Vercel

1. Tag **https://vercel.com** oo login.
2. **Add New Project** → **Import Git Repository**.
3. Dooro repo-kaaga (GitHub / GitLab / Bitbucket).
4. **Root Directory**: geli `forenend` (waa inuu yahay folder-ka Next.js).
5. **Framework Preset**: Next.js waa la ogaaday automatic.

## 2. Environment Variables

**Settings → Environment Variables** geli:

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.railway.app` (tusaale) | URL-ka backend-ka (Express + MongoDB) haddii aad meel kale ku saarto |
| `PAYMENT_API_URL` | `http://31.220.82.247:7871/pay` | Payment API (haddii la isticmaalo) |
| `PAYMENT_DEMO_MODE` | `true` kaliya haddii aad demo payment rabto | Ka tag empty production |

Tusaale: haddii backend-ka aad ku saarto **Railway** ama **Render**, copy URL-ka API-ga (e.g. `https://deeqo-api.railway.app`) oo geli `NEXT_PUBLIC_API_URL`.

## 3. Deploy

- Kadib **Deploy** riix; Vercel wuxuu build ku sameynaa `forenend` oo soo saarayaa link (e.g. `https://deeqo.vercel.app`).

## 4. Backend (MongoDB + Express)

- Frontend (Next.js) waa Vercel.
- Backend (folder `backend/`) saar **Railway**, **Render**, **Fly.io**, etc., oo geli MongoDB URI (e.g. MongoDB Atlas).
- Kadib geli URL-ka backend-ka sida kor ku xusan `NEXT_PUBLIC_API_URL` ee Vercel.

## 5. Tixraac

- **vercel.json** – config-ka Vercel (framework, regions).
- **.env.example** – tusaale env vars (Vercel ma read karo .env, ee geli vars-ka Vercel dashboard).
