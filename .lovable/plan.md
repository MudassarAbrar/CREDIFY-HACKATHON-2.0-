# Peer Skill Exchange Marketplace — Frontend MVP Plan

## Design System

- **Fresh design** with modern color, clean borders, minimal aesthetic
- Host Grotesk font, uppercase tracking for labels
- Fade-in animations, hover transitions with pink accent
- Grid-based cards, border-heavy design, spacious padding
- Dark/light mode support

## Pages (all with mock data)

### 1. Landing Page (/)

- Hero section: "Trade skills, earn credits" with search bar and CTA
- Features section: Credit system, peer matching, skill wallet (with icons)
- How it works: 3-step visual (Teach → Earn → Learn)
- Stats bar: Active users, skills exchanged, credits in circulation
- Testimonials carousel with placeholder avatars

### 2. Browse Skills (/browse)

- Search bar with category/rate/complexity filters
- Grid of SkillCards showing title, teacher name, rate, complexity badge
- Quick-view modal with full skill details
- "Request to Learn" button on each card

### 3. Skill Wallet (/wallet)

- Large animated credit balance display (starting balance: 100)
- Quick stats: Total earned, total spent, net balance
- Transaction history table with earn/spend type filter
- Badges section (placeholder)

### 4. Create Skill Offer (/teach)

- Form: Skill title, description, category dropdown, rate per hour, complexity selector, availability
- Preview card showing how the listing will appear
- Form validation with Zod + React Hook Form

### 5. Create Skill Request (/learn)

- Form: Skill title, description, category, preferred rate range, urgency, max budget
- Form validation with Zod + React Hook Form

### 6. Bookings (/bookings)

- Tabbed interface: Upcoming, Past, Requests
- BookingCards with status badges (pending/confirmed/completed/cancelled)
- Action buttons: Confirm, Cancel, Mark Complete

### 7. Profile (/profile)

- User info card (type badge: Student/Professional, join date, mock rating)
- Skills taught & skills learned lists
- Recent activity feed
- Endorsements placeholder

### 8. Auth Pages (/login, /register)

- Login form with email/password
- Register form with user type selection (Student/Professional)
- Mock auth flow (stores user in React state/localStorage)

### 9. Admin Dashboard (/admin)

- Placeholder structure with navigation shell
- Mock stats overview

## Core Components

- **SkillCard**: Displays skill info, teacher, rate, complexity badge, action buttons
- **CreditBalance**: Animated credit display with earn/spend indicators
- **TransactionHistory**: Filterable transaction table
- **BookingCard**: Booking details with status and actions
- **MatchingEngine**: Simple display of matched peers (mock data)
- **Navbar**: Updated navigation with all routes, mock user menu

## Mock Data

- 10-15 sample skills across categories (Design, Development, Music, Languages, etc.)
- 5-6 sample users (mix of Students and Professionals)
- Sample bookings and transactions
- Credit system rates: Student multipliers (1.2x earn, 0.8x spend), Professional (1x)

## Navigation

Home → Browse → Wallet → Teach → Learn → Bookings → Profile