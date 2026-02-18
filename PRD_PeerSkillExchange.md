# Product Requirements Document (PRD): Peer Skill Exchange

## 1. Executive Summary

**Problem Statement:**  
Access to quality skill development is limited by affordability and lack of peer-to-peer learning opportunities. Traditional course platforms are expensive and do not incentivize community-driven knowledge exchange.

**Proposed Solution:**  
A Peer Skill Exchange marketplace where users (students and professionals) trade skills using a time- and value-based credit system. Users earn credits by teaching and spend credits to learn, with rates based on user type and skill complexity.

**Success Criteria:**
- Users complete at least one skill exchange (teach or learn).
- High satisfaction in post-exchange reviews.
- All transactions settled using credits (no fiat).
- Dispute resolution available (admin/agent); MVP supports basic flow.
- System supports hundreds of concurrent users with responsive APIs.

---

## 2. User Experience & Functionality

**User Personas:**
- **Student:** Learns and teaches skills; benefits from favorable exchange rates.
- **Professional:** Offers or requests skills; pays higher rates to incentivize student participation.
- **Admin/Agent:** Handles disputes and platform oversight (future: credit arbitration).

**User Stories (Implemented):**
- As a user, I can register and log in with email or Google OAuth.
- As a user, I can browse skills offered by others (my own teaching skills are hidden).
- As a user, I can create skill offers and skill requests.
- As a user, I see my wallet with credit balance and transaction history; balance updates after bookings and payment release.
- As a user, I can request a booking, and the teacher can confirm; both can mark completion and release payment.
- As a user, I receive notifications for new booking requests, confirmations, payment releases, and new messages.
- As a user, I can view transaction details (worked with whom, when, which skill) by clicking a transaction row.
- As a user, I can edit my full profile (name, bio, links, location, timezone, availability, education, work, languages, response time).
- As a user, I can write a review for someone I taught or learned from (from their profile or the Reviews page).
- As a user, I can message other users and view conversations.

**Acceptance Criteria:**
- Auth: Email/password and Google OAuth; JWT-based sessions; env setup documented (JWT_SECRET, Google client ID).
- Browse: Skills list excludes the current user’s own teaching skills.
- Wallet: Balance reflects credits after booking flow and payment release; refresh after confirm/cancel/complete.
- Notifications: New booking request, booking confirmed, payment released, session completed, new message.
- Transactions: List with type/amount/date; row click shows other party, skill, session date, duration.
- Profile: All displayed stats and details are editable (including timezone and availability).
- Reviews: Leave a review from another user’s profile (“Write review” → Reviews page filtered by that user) and from Reviews page for completed bookings.

**Non-Goals (MVP):**
- No fiat currency; credits only.
- No automated course content; focus on live peer exchange.
- Dispute resolution UI is “coming soon”; backend/agent can be extended later.

---

## 3. Technical Specifications (Current Status)

**Stack:**
- **Frontend:** React (Vite, TypeScript), React Router, Tailwind CSS, shadcn/ui.
- **Backend:** Node.js, Express, JWT auth.
- **Database:** MySQL (user data, profiles, skills, bookings, transactions, notifications, messages, reviews).

**Key Features Implemented:**
- Auth: Register, login, Google OAuth (optional via `VITE_GOOGLE_CLIENT_ID`), JWT, refresh user (balance/profile). Google sign-up defaults to Student; **user type (Student/Professional) editable** in Profile → Edit Profile (backend accepts `user_type` on profile update).
- Skills: Create offer/request, browse (excluding own teaching skills), categories.
- Bookings: Request → confirm/cancel → complete → two-party completion confirmation → release payment; credits deducted on confirm, released to teacher on completion. **Teacher/learner name on booking cards links to that user’s profile.**
- Wallet: Balance display, transaction history, filters (all/earn/spend); transaction detail modal (other party, skill, date, duration).
- Notifications: In-app for booking and message events; link to relevant page.
- Messages: **Search** at top of conversation list; no “0” in preview/unread when empty; **mobile**: list-only by default, tap conversation to open chat, **Back** button returns to list; scrollable conversation list.
- Profile: View own and others’; edit own (name, **user type**, bio, links, location, timezone, availability, education, work, languages, response time). **Reviews tab** shows **reviewer name** for each review (not “Anonymous”). **Followers/Following**: click “X followers · Y following” to open modal with Followers and Following tabs, listing users with links to their profiles.
- Nav (logged in): Browse first, then Wallet, Teach, Learn, Bookings.
- Reviews: List (as teacher / as learner), leave review for completed bookings; “Write review” on another user’s profile links to Reviews filtered by that user.
- Disputes: Placeholder/“coming soon” in UI.

**Integration & Config:**
- REST APIs for auth, profiles, skills, bookings, transactions, notifications, messages, reviews.
- Environment: `JWT_SECRET` (documented in ENV_SETUP.md), optional `VITE_GOOGLE_CLIENT_ID` for Google sign-in.

---

## 4. AI / Future System Requirements

- **Matching:** Algorithmic matching by skill, availability, and user type can be extended.
- **Credit arbitration:** Future agent for dispute valuation and credit adjustments.
- **Dispute resolution:** Admin interface and AI-assisted suggestions planned post-MVP.

---

## 5. Risks & Roadmap

**Phased Rollout:**
- **MVP (current):** Skill wallet, credits, bookings, two-party completion, payments, notifications, messages, reviews, full profile edit, transaction details.
- **v1.1:** Dispute resolution, badges, endorsements, analytics.
- **v2.0:** AI credit arbitration, dynamic rates, mobile, external integrations.

**Risks:**
- Matching accuracy and fairness of credit rates.
- Scalability and latency as user base grows.
- Security: data protection, credit fraud prevention.

---

*Last updated: user type editable (incl. Google users), profile reviews show reviewer name, booking names link to profiles, messages search + mobile back + scroll, followers/following modal, nav order (Browse → Wallet).*
