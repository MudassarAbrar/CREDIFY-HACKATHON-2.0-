# Environment setup (OAuth, JWT, API)

This project uses two places for environment variables: **frontend (Vite)** and **backend (Node)**.

---

## 1. Frontend (client) – root `.env` or `.env.local`

Create a file in the **project root** (same folder as `package.json` and `vite.config.ts`):

- **`.env`** or **`.env.local`**

Add:

```env
# Base URL of the API (no trailing slash)
VITE_API_URL=http://localhost:3001

# Google OAuth – required for "Continue with Google" on Login and Register
# Get this from Google Cloud Console (see below)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

- **Which file?**  
  Use **root** `.env` or `.env.local` (next to `vite.config.ts`). Vite only loads env from the project root; variables must start with `VITE_` to be exposed to the client.

---

## 2. Backend (server) – `server/.env`

Create **`server/.env`** (inside the `server` folder):

```env
# Server port
PORT=3001

# Frontend URL (for CORS and redirects). No trailing slash.
FRONTEND_URL=http://localhost:8080

# JWT – required for login/register and protected API routes
# Generate a long random string (see below)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars-long

# Optional: token expiry (default 7d)
JWT_EXPIRES_IN=7d

# Google OAuth – must match the frontend client ID
# Same value as VITE_GOOGLE_CLIENT_ID (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Database (if using MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=peer_skill_exchange
DB_PORT=3306
```

- **Which file?**  
  **`server/.env`** – the Node server loads this via `dotenv` in `server/index.js` and `server/config/database.js`.

---

## 3. Where to get the values

### JWT secret

- **What it is:** A secret key used to sign and verify JWTs (login tokens). It is **not** from a third party; you create it.
- **How to generate:**
  - **Node:** run in terminal:  
    `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Or use any long random string (e.g. 32+ characters from a password generator).
- **Where to set:**  
  **`server/.env`** as `JWT_SECRET=...`.  
  Do **not** put it in the frontend `.env`; it must stay server-only.

### Google OAuth (Client ID)

- **Where:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials**.
- **Steps:**
  1. Create or select a project.
  2. **Credentials** → **Create credentials** → **OAuth client ID**.
  3. Application type: **Web application**.
  4. Add **Authorized JavaScript origins:**
     - `http://localhost:8080` (Vite dev)
     - `https://your-production-domain.com` (when you deploy)
  5. **Authorized redirect URIs** (if you use a redirect flow; for “one-tap”/popup you may leave default or add):
     - `http://localhost:8080` (and your production URL if needed)
  6. Create → copy the **Client ID** (ends in `.apps.googleusercontent.com`).
- **Where to set:**
  - **Frontend:** root **`.env`** → `VITE_GOOGLE_CLIENT_ID=...`
  - **Backend:** **`server/.env`** → `GOOGLE_CLIENT_ID=...` (same value).

---

## 4. Redirect URLs summary

| Use case              | URL to add                          |
|-----------------------|-------------------------------------|
| Vite dev (local)      | `http://localhost:8080`             |
| Production            | `https://your-domain.com`           |

Add these in Google Cloud Console under your OAuth client:

- **Authorized JavaScript origins:** same URLs as above.
- **Authorized redirect URIs:** same URLs (e.g. `http://localhost:8080` and `https://your-domain.com`) if your app uses a redirect after Google sign-in.

---

## 5. Checklist

- [ ] Root **`.env`** (or `.env.local`) with `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`.
- [ ] **`server/.env`** with `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `FRONTEND_URL`, and DB vars if needed.
- [ ] Google Cloud OAuth client created; Client ID copied into both env files.
- [ ] Redirect/origin URLs set in Google Console for local and production.
- [ ] Restart Vite dev server and Node server after changing env files.

After this, OAuth (Continue with Google) and JWT-based auth can work end-to-end.

---

## 6. Troubleshooting

### "POST /api/auth/google 500 (Internal Server Error)"

The **backend** (Node server) is returning 500. You need **both** of these in **`server/.env`** (not only the client ID):

1. **`JWT_SECRET`** – required for the server to issue login tokens. If it’s missing, Google login will 500.
   - Generate one:  
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Add to **`server/.env`**:  
     `JWT_SECRET=<paste-the-output-here>`

2. **`GOOGLE_CLIENT_ID`** – must be the **exact same** value as in your root `.env` as `VITE_GOOGLE_CLIENT_ID` (same OAuth client from Google Cloud Console).

Also make sure:

- The **backend is running** (e.g. `npm run dev` or `node server/index.js` in the `server` folder, usually on port **3001**). The frontend proxies `/api` to it; if the backend is down, you can get 502/503 or connection errors.
- **Database** is set up and migrations have been run (Google login creates/fetches users in the DB). If the DB is missing or the `users` table doesn’t exist, the server can 500.

**Check the server terminal** when you click "Continue with Google". The server logs the real error (e.g. "JWT_SECRET is not set" or a DB error). That message tells you what to fix.

### "Cross-Origin-Opener-Policy policy would block the window.postMessage call"

This is fixed by sending the right headers from the **Vite dev server** so Google Sign-In can use `postMessage`. The project’s `vite.config.ts` already sets:

- `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- `Cross-Origin-Embedder-Policy: unsafe-none`

Restart the Vite dev server (`npm run dev`) after pulling this change. If you still see the warning, try a hard refresh (Ctrl+Shift+R) or another browser.

### Google button does nothing or "invalid_client"

- In [Google Cloud Console](https://console.cloud.google.com/) → Credentials → your OAuth 2.0 Client ID:
  - **Authorized JavaScript origins** must include **`http://localhost:8080`** (no trailing slash).
- Ensure **`GOOGLE_CLIENT_ID`** in **`server/.env`** and **`VITE_GOOGLE_CLIENT_ID`** in the **root** `.env` are exactly the same string.
