# Fluvex

**Fleet and delivery management platform** for logistics companies. Fluvex centralizes vehicles, drivers, deliveries, real-time mapping, analytics, and environmental impact tracking.

---

## Features

| Module                   | Description                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| **Dashboard**            | Overview of active deliveries, fleet status, revenue, and CO₂ indicators |
| **Fleet & Drivers**      | Manage drivers, vehicles, and assignments                                |
| **Real-Time Map**        | Geolocation tracking powered by Mapbox                                   |
| **Deliveries**           | Delivery creation, tracking, and automatic status expiration             |
| **Analytics**            | Interactive charts and CSV exports                                       |
| **Environmental Impact** | Sustainability metrics and route optimization                            |
| **Settings**             | Company profile, notifications, light/dark mode, EN/FR support           |

---

## Tech Stack

* **Framework** — Next.js 16 (App Router)
* **UI** — React 19, Tailwind CSS, Lucide Icons
* **Database** — MongoDB Atlas via Prisma
* **Authentication** — Signed sessions (HTTP-only `fluvex_session` cookie)
* **Validation** — Zod + React Hook Form
* **Maps** — Mapbox GL / react-map-gl
* **Media Storage** — Cloudinary
* **Charts** — Recharts

---

## Architecture

```text
Unauthenticated Visitor  →  /  →  redirect /login
Authenticated User       →  /  →  redirect /dashboard

middleware.ts            Route protection (cookie-based)
app/dashboard/layout     Server-side requireAuth()
lib/auth.ts              Sessions and password hashing (scrypt)
lib/api-auth.ts          requireSession() for API routes
```

Authentication is based on **two security layers**:

1. **Middleware** (`middleware.ts`) — redirects `/` to `/login` or `/dashboard` and protects `/dashboard/*`.
2. **Server Layout** (`app/dashboard/layout.tsx`) — executes `requireAuth()` before rendering any dashboard content.

Dashboard pages use `requireAuth()` to access `userId` and `companyId` without duplicating authentication logic on the client side.

---

## Project Structure

```text
app/
├── (auth)/              Login & registration
├── api/                 REST API routes (auth, deliveries, fleet, exports...)
├── dashboard/           Protected pages (Server + Client Components)
├── driver/              Driver tracking
└── page.tsx             Root redirect

lib/
├── auth.ts              Sessions & password management
├── db.ts                Prisma singleton client
├── api-auth.ts          API guards
└── validations/         Zod schemas

prisma/
└── schema.prisma        MongoDB models

src/
├── components/          UI, layouts, maps, notifications
└── contexts/            Theme, language, sidebar

middleware.ts            Route protection
```

---

## Prerequisites

* Node.js 20+
* npm (or pnpm / yarn)
* MongoDB Atlas account (free cluster available)
* Mapbox token
* Cloudinary account (optional for initial setup)

---

## Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd Fluvex

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# 5. Start the development server
npm run dev
```

Open http://localhost:3000 — you will automatically be redirected to `/login`.

---

## Environment Variables

| Variable                   | Required | Description                                           |
| -------------------------- | :------: | ----------------------------------------------------- |
| `DATABASE_URL`             |     ✅    | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `SESSION_SECRET`           |     ✅    | HMAC secret used for session signing                  |
| `NEXT_PUBLIC_MAPBOX_TOKEN` |     ✅    | Public Mapbox token                                   |
| `CLOUDINARY_CLOUD_NAME`    |     ⚪    | Cloudinary cloud name                                 |
| `CLOUDINARY_API_KEY`       |     ⚪    | Cloudinary API key                                    |
| `CLOUDINARY_API_SECRET`    |     ⚪    | Cloudinary API secret                                 |

### Common MongoDB Atlas Issues

If login or registration returns *"Database connection failed"* or `SCRAM failure: bad auth`:

1. Verify your Atlas username and password under **Database Access**.
2. Allow your IP address in **Network Access** (or use `0.0.0.0/0` during development).
3. URL-encode special characters in your password (`@` → `%40`, `#` → `%23`, etc.).
4. Ensure only one active `DATABASE_URL=` exists in your `.env` file.

Example:

```env
DATABASE_URL="mongodb+srv://myuser:MyP%40ssword@cluster0.xxxxx.mongodb.net/fluvex?retryWrites=true&w=majority"
```

---

## NPM Scripts

| Command              | Action                        |
| -------------------- | ----------------------------- |
| `npm run dev`        | Start development server      |
| `npm run build`      | Production build              |
| `npm run start`      | Start production server       |
| `npm run lint`       | Run ESLint                    |
| `npx prisma studio`  | Open database GUI             |
| `npx prisma db push` | Sync Prisma schema to MongoDB |

---

## Main Routes

| Route                       | Access    | Purpose                               |
| --------------------------- | --------- | ------------------------------------- |
| `/`                         | Public    | Redirects to `/login` or `/dashboard` |
| `/login`                    | Public    | User login                            |
| `/register`                 | Public    | Company registration                  |
| `/dashboard`                | Protected | Main dashboard                        |
| `/dashboard/fleet`          | Protected | Fleet & drivers management            |
| `/dashboard/map`            | Protected | Real-time map                         |
| `/dashboard/deliveries`     | Protected | Deliveries management                 |
| `/dashboard/analytics`      | Protected | Analytics                             |
| `/dashboard/drivers`        | Protected | Driver performance                    |
| `/dashboard/sustainability` | Protected | Environmental impact                  |
| `/dashboard/settings`       | Protected | Settings                              |

---

## API Overview

| Endpoint                   | Method    | Description                |
| -------------------------- | --------- | -------------------------- |
| `/api/auth/login`          | POST      | User login                 |
| `/api/auth/register`       | POST      | Company registration       |
| `/api/auth/logout`         | POST      | User logout                |
| `/api/auth/me`             | GET       | Current authenticated user |
| `/api/deliveries`          | GET, POST | Deliveries                 |
| `/api/drivers`             | GET, POST | Drivers                    |
| `/api/vehicles`            | GET, POST | Vehicles                   |
| `/api/telemetry/locations` | GET       | GPS locations              |
| `/api/export/*`            | GET       | CSV exports                |
| `/api/upload`              | POST      | Cloudinary uploads         |

All business API routes require a valid authenticated session through `requireSession()` in `lib/api-auth.ts`.

---

## Deployment

1. Build the project:

```bash
npm run build
```

2. Configure all environment variables on your hosting platform (Vercel, Railway, etc.).
3. Set a secure and unique `SESSION_SECRET` in production.
4. Allow production server IPs in MongoDB Atlas.
5. Start the application:

```bash
npm run start
```

---

## Mobile Application

📱 A dedicated Fluvex mobile application is currently under development and will provide real-time delivery tracking, driver management, and logistics monitoring directly from mobile devices.

---

## License

Private project — All rights reserved.

---

## Author

**Gerard Lonzi**

Fleet & Logistics Technology Solutions.
