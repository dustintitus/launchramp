# LaunchRamp

A **Kenect-style shared inbox with built-in CRM** — a messaging-first CRM platform for dealers, local operators, and media companies.

## Features

- **Shared Inbox**: Team inbox with conversation list, filters (All / Assigned / Unassigned), search
- **SMS/MMS Messaging**: Send and receive via Twilio
- **CRM Lite**: Contact profiles, lifecycle stages (lead → qualified → customer → churned), tags, owner assignment
- **Activity Feed**: Messages, notes, stage changes
- **Templates**: Save and insert message templates
- **Consent Tracking**: Opt-in / opt-out events (schema ready)

## Tech Stack

| Layer    | Stack                     |
|----------|---------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind, Radix UI |
| Backend  | Next.js API routes, Prisma |
| Database | PostgreSQL                |
| Messaging| Twilio (abstracted)       |
| Infra    | Redis, WebSockets (planned)|

## Project Structure

```
launchramp/
├── apps/
│   └── web/                 # Next.js App Router app
│       ├── src/
│       │   ├── app/         # Routes, API, layout
│       │   ├── components/  # inbox, crm, ui
│       │   ├── features/    # inbox hooks, types
│       │   └── lib/         # utils, auth
├── packages/
│   ├── db/                  # Prisma schema, client, seed
│   ├── api/                 # Services, providers, webhooks
│   └── shared/              # Types, constants
```

## Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL
- (Optional) Twilio account for SMS

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment

A `.env` file is included with defaults. Update `DATABASE_URL` to match your PostgreSQL setup:

```bash
# If .env doesn't exist, create it:
cp .env.example .env

# Edit .env and set DATABASE_URL. Common local examples:
# PostgreSQL default:  postgresql://postgres:postgres@localhost:5432/launchramp?schema=public
# No password:        postgresql://postgres@localhost:5432/launchramp?schema=public
# Custom user:        postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/launchramp?schema=public
```

For Twilio SMS:

```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=...
```

### 4. Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed creates a demo org (`org_launchramp_demo`) and users that work with the default auth. No extra env config needed for local dev.

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The inbox is at [http://localhost:3000/inbox](http://localhost:3000/inbox).

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/conversations` | List conversations (assignedTo, unassigned, search) |
| GET | `/api/conversations/:id` | Get conversation + messages |
| PATCH | `/api/conversations/:id/assign` | Assign/unassign conversation |
| POST | `/api/messages` | Send message (conversationId, text) |
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts` | Create contact |
| GET | `/api/contacts/:id` | Get contact |
| PATCH | `/api/contacts/:id` | Update contact |
| GET | `/api/contacts/:id/activities` | List activities |
| POST | `/api/contacts/:id/notes` | Add note |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| POST | `/api/webhooks/twilio/inbound` | Twilio inbound SMS webhook |
| POST | `/api/webhooks/twilio/status` | Twilio status callback |

## Twilio Webhook Setup

1. In Twilio Console → Phone Numbers → your number
2. **Configure**:
   - A message comes in: `https://your-domain.com/api/webhooks/twilio/inbound`
   - Status callback: `https://your-domain.com/api/webhooks/twilio/status`

For local dev, use [ngrok](https://ngrok.com) or similar to expose `localhost`.

## Auth (MVP)

MVP uses placeholder auth via env:

- `NEXT_PUBLIC_ORG_ID` — default org
- `NEXT_PUBLIC_USER_ID` — current user

Replace with NextAuth, Clerk, or your auth provider for production.

## Build

```bash
npm run build
```

## License

Proprietary
