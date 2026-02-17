# Peer Skill Exchange - Backend Server

Express.js backend server for the Peer Skill Exchange Marketplace.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `server/.env` (see project root **ENV_SETUP.md** for full list and Google OAuth):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=peer_skill_exchange
DB_PORT=3306

JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_EXPIRES_IN=7d

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Optional: Google OAuth (see ENV_SETUP.md)
# GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

3. Run database migrations:
```bash
cd server
node run-migration.js
```
(For the initial DB schema, run the SQL files in `migrations/` in order if needed. Payment confirmation flow: `node run-migration.js`.)

4. Start the server:
```bash
npm run dev
```

## API Documentation

See main README.md for API endpoint documentation.

## Database Schema

The database includes the following tables:
- `users` - User accounts and credit balances
- `skills` - Skills being taught
- `bookings` - Skill exchange sessions
- `transactions` - Credit transaction history
- `user_skills` - User skill proficiencies

## Services

- `creditService.js` - Credit calculation logic
- `matchingService.js` - Skill matching algorithm
