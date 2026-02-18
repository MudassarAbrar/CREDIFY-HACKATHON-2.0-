# Credify – Peer Skill Exchange

[![CREDIFY Hackathon 2.0](https://img.shields.io/badge/CREDIFY-Hackathon%202.0-blue)](https://github.com/MudassarAbrar/CREDIFY-HACKATHON-2.0-)

A **peer-to-peer skill exchange marketplace** where users earn credits by teaching and spend credits to learn. No cash—credits only. Built for the **CREDIFY Hackathon 2.0**.

---

## About

Access to quality skill development is often limited by cost and lack of peer learning. Credify lets students and professionals **trade skills** using a **time- and value-based credit system**: teach to earn credits, learn by spending them. Rates can reflect user type (e.g. student vs professional) and skill complexity.

### Features

- **Auth** – Email/password and **Google OAuth** (optional), JWT-based sessions. Google users default to “Student”; **user type (Student/Professional) is editable** in Profile → Edit Profile.
- **Skills** – Create and browse skill offers/requests; your own teaching skills are hidden from browse
- **Bookings** – Request → confirm → complete → two-party completion → **payment release** (credits). **Click teacher/learner name** on a booking card to open their profile.
- **Wallet** – Live credit balance, transaction history (earn/spend), **click a row** to see who you worked with, when, and which skill
- **Notifications** – New booking request, confirmed, payment released, new message
- **Messages** – In-app conversations; **search** at the top; no “0” preview; **mobile**: list-only view, tap conversation to open chat, **Back** returns to list; scrollable list
- **Profile** – Full profile edit (name, **user type**, bio, links, location, timezone, availability, education, work, languages, response time). **Reviews tab** shows **reviewer name** (not “Anonymous”) for reviews on your profile. **Followers/Following** – click “X followers · Y following” to open a modal with lists and links to profiles.
- **Reviews** – Leave reviews for people you taught or learned from (from their profile or the Reviews page)
- **Nav (logged in)** – Browse first, then Wallet, Teach, Learn, Bookings
- **Disputes** – Placeholder for future admin/agent resolution

---

## Tech Stack

| Layer    | Stack |
|----------|--------|
| Frontend | React 18, Vite, TypeScript, React Router, Tailwind CSS, shadcn/ui |
| Backend  | Node.js, Express, JWT auth |
| Database | MySQL (users, profiles, skills, bookings, transactions, notifications, messages, reviews) |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MySQL** (local or remote)
- (Optional) Google Cloud project for OAuth

### 1. Clone and install

```bash
git clone https://github.com/MudassarAbrar/CREDIFY-HACKATHON-2.0-.git
cd CREDIFY-HACKATHON-2.0-
npm install
cd server && npm install && cd ..
```

### 2. Environment

- **Backend:** Create `server/.env` with the variables listed in **[ENV_SETUP.md](./ENV_SETUP.md)**.
- **Frontend:** Create `.env` in the project root if you need to override API URL or enable Google sign-in.

**Required (backend `server/.env`):**

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` – MySQL
- `JWT_SECRET` – e.g. generate with:  
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`  
  See [ENV_SETUP.md](./ENV_SETUP.md) for more options.

**Optional:** `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend) for “Continue with Google”. Details in [ENV_SETUP.md](./ENV_SETUP.md).

### 3. Database

```bash
cd server
node run-migration.js
node migrations/run-migration-004.js
node scripts/seed-admin.js
# If you have seed data:
# node migrations/seed-data.js
cd ..
```

Migration 004 adds the admin role and dispute tables. The seed-admin script creates an admin user (set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`, or use defaults; see [ENV_SETUP.md](./ENV_SETUP.md)).

### 4. Run

**Terminal 1 – backend:**

```bash
cd server
npm run dev
```

**Terminal 2 – frontend:**

```bash
npm run dev
```

- Frontend: **http://localhost:8080** (or the port Vite prints)
- API: **http://localhost:3001**

---

## Project Structure

```
├── src/                    # React frontend (Vite)
│   ├── components/         # UI components (Navbar, SkillCard, TransactionHistory, etc.)
│   ├── contexts/           # Auth context
│   ├── hooks/              # useToast, etc.
│   ├── lib/                # API client, types
│   └── pages/              # Login, Register, Browse, Bookings, Wallet, Profile, Reviews, Messages, etc.
├── server/                 # Express backend
│   ├── controllers/        # Auth, bookings, messages, notifications, profiles, skills, transactions, reviews
│   ├── middleware/         # JWT auth
│   ├── migrations/         # SQL migrations + seed
│   ├── routes/
│   └── services/           # Credits, notifications
├── public/
├── ENV_SETUP.md            # Environment variables and JWT/Google setup
├── PRD_PeerSkillExchange.md # Product requirements (current status)
└── README.md               # This file
```

---

## API Overview

| Area        | Examples |
|------------|----------|
| Auth       | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, Google OAuth |
| Profiles   | `GET/PUT /api/profiles/:id`, `GET /api/profiles/:id/stats` |
| Skills     | `GET/POST /api/skills`, skill requests |
| Bookings   | `GET/POST /api/bookings`, confirm, cancel, complete, confirm-completion |
| Transactions | `GET /api/transactions` (with booking/other-party details) |
| Notifications | `GET /api/notifications` |
| Messages   | `GET/POST /api/messages`, conversations |
| Reviews    | `GET/POST /api/reviews` |
| Follows    | `GET /api/follows/:userId/followers`, `GET /api/follows/:userId/following`, `POST/DELETE /api/follows/:userId` (auth) |

All protected routes use `Authorization: Bearer <token>`.

---

## Documentation

- **[ENV_SETUP.md](./ENV_SETUP.md)** – Environment variables, JWT_SECRET, Google OAuth
- **[PRD_PeerSkillExchange.md](./PRD_PeerSkillExchange.md)** – Product requirements and current feature set
- **[server/README.md](./server/README.md)** – Backend setup and schema summary

---

## License

This project was built for **CREDIFY Hackathon 2.0**. See repository license for terms.

---

## Repository

**GitHub:** [github.com/MudassarAbrar/CREDIFY-HACKATHON-2.0-](https://github.com/MudassarAbrar/CREDIFY-HACKATHON-2.0-)
