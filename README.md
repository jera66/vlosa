# VLOSA — Virtual Life Operating System Agent

![VLOSA](web/public/assets/vlosa_screenshot.png)

**A personal AI-powered life operations platform that manages 80% of your life (inbox, tasks, and communications with intelligent automation.)**

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [Setup & Installation](#setup--installation)
8. [Environment Variables](#environment-variables)
9. [Authentication](#authentication)
10. [Core Concepts](#core-concepts)
11. [API Documentation](#api-documentation)
12. [Integrations](#integrations)
13. [UI/UX Patterns](#uiux-patterns)
14. [Development Guidelines](#development-guidelines)
15. [Deployment](#deployment)
16. [Future Roadmap](#future-roadmap)

---

## Overview

VLOSA (Virtual Life Operating System Agent) is a comprehensive personal automation platform designed to manage your digital life intelligently. It combines inbox management, task tracking, AI-powered communication assistance, and rule-based automation into a unified system available on both web and mobile.

### What VLOSA Does

- **Intelligent Inbox Management**: Syncs with Gmail, categorizes messages, and drafts AI-powered replies
- **Task Orchestration**: Creates, tracks, and manages tasks with priority levels and approval workflows
- **Rules Engine**: Enforces behavioral rules (quiet hours, communication windows, automation posture)
- **Persona System**: Maintains your communication style, values, and preferences for AI-generated content
- **Memory Bank**: Stores important context and information for personalized AI assistance
- **Activity Logging**: Tracks all system actions for transparency and audit trails

---

## Key Features

### 📬 Inbox Management
- **Gmail Integration**: Bidirectional sync with Gmail using OAuth2
- **AI Draft Generation**: GPT-powered reply suggestions based on your persona
- **Priority Classification**: Automatic categorization (urgent, important, routine, low)
- **Status Workflow**: incoming → ai_draft → approved → sent
- **Rule Enforcement**: Blocks actions during quiet hours or based on automation posture

### ✅ Task Management
- **Flexible Statuses**: incoming, approved, in_progress, completed, rejected
- **Priority Levels**: urgent, important, routine, low
- **Due Date Tracking**: Set and monitor task deadlines
- **Approval Workflow**: Tasks require approval before execution (unless auto-run mode)

### 🧠 Persona & Memory
- **Persona**: Define your communication tone, structure, values, and phrase preferences
- **Memory Bank**: Store and pin important contextual information
- **AI Context**: Both feed into AI-generated drafts for personalized responses

### ⚙️ Rules Engine
- **Automation Posture**: 
  - `approval_first` (default): All actions require human approval
  - `auto_run`: Actions execute automatically based on rules
- **Quiet Hours**: Block communications during specified time windows
- **Communication Windows**: Restrict email/call actions to allowed hours
- **Granular Controls**: Toggle specific behaviors (auto-draft, auto-send, unknown senders, etc.)

### 📱 Cross-Platform
- **Web Dashboard**: Full-featured React web application
- **Mobile App**: Native iOS/Android experience via Expo/React Native
- **Synchronized State**: Real-time data sync across all platforms

### 🎨 Unique UX
- **VLOSA Spin Overlay**: Custom 3-second spinning logo animation for all major actions
- **Neumorphic Design**: Soft, tactile UI with consistent design language
- **Error Handling**: Styled, user-friendly error messages with clear guidance

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         VLOSA System                         │
├─────────────────┬───────────────────────┬───────────────────┤
│   Web Client    │    Mobile Client      │   Backend API     │
│   (React/Vite)  │  (Expo/React Native)  │   (Node.js)       │
├─────────────────┼───────────────────────┼───────────────────┤
│ • Dashboard     │ • Native Tabs         │ • REST Endpoints  │
│ • Auth Pages    │ • Auth WebView        │ • Gmail OAuth     │
│ • Neumorphic UI │ • VLOSA Overlay       │ • Rules Engine    │
│                 │                       │ • AI Integration  │
└─────────────────┴───────────────────────┴───────────────────┘
                            ↓
                ┌───────────────────────┐
                │  PostgreSQL Database  │
                │  (Neon Serverless)    │
                └───────────────────────┘
                            ↓
                ┌───────────────────────┐
                │  External Services    │
                │ • Gmail API           │
                │ • ChatGPT/OpenAI      │
                └───────────────────────┘
```

### Data Flow

1. **User Action** → Web/Mobile Client
2. **API Request** → Backend (with session authentication)
3. **Rules Check** → Rules Engine validates action against user settings
4. **Database Operation** → PostgreSQL (via Neon serverless driver)
5. **External API Call** (if needed) → Gmail, OpenAI, etc.
6. **Response** → Client (with activity logging)
7. **UI Update** → React Query invalidation + re-fetch

---

## Tech Stack

### Frontend (Web)
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **React Query (@tanstack/react-query)**: Data fetching, caching, synchronization
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Motion/React (Framer Motion)**: Animations

### Frontend (Mobile)
- **Expo SDK 52+**: React Native framework
- **Expo Router**: File-based navigation
- **React Native Reanimated**: Smooth animations
- **Lucide React Native**: Icons
- **Expo Glass Effect**: Liquid glass UI components
- **Expo Auth Session**: OAuth flows

### Backend
- **Node.js**: Runtime
- **Next.js API Routes Pattern**: Serverless functions
- **@neondatabase/serverless**: PostgreSQL driver
- **NextAuth.js**: Authentication framework
- **Argon2**: Password hashing

### Database
- **PostgreSQL 17**: Primary database
- **Neon Serverless**: Managed PostgreSQL platform

### External APIs
- **Gmail API**: Email integration
- **Google OAuth2**: Authentication for Gmail
- **OpenAI GPT**: AI-powered draft generation

---

## Project Structure

```
/apps
├── web/
│   └── src/
│       ├── app/
│       │   ├── account/              # Auth pages (signin, signup, logout)
│       │   ├── api/                  # Backend API routes
│       │   │   ├── auth/             # Auth endpoints
│       │   │   ├── integrations/     # Gmail OAuth & sync
│       │   │   │   └── gmail/
│       │   │   └── los/              # LOS core endpoints
│       │   │       ├── inbox/
│       │   │       ├── tasks/
│       │   │       ├── memory/
│       │   │       ├── persona/
│       │   │       ├── settings/
│       │   │       ├── activity/
│       │   │       └── user-profile/
│       │   ├── layout.jsx            # Root layout
│       │   └── page.jsx              # Dashboard (main page)
│       ├── components/
│       │   └── HomePage/             # Dashboard view components
│       │       ├── DashboardView.jsx
│       │       ├── InboxView.jsx
│       │       ├── TasksView.jsx
│       │       ├── MemoryView.jsx
│       │       ├── PersonaView.jsx
│       │       ├── SettingsView.jsx
│       │       ├── RulesView.jsx
│       │       ├── IntegrationsView.jsx
│       │       ├── ActivityView.jsx
│       │       └── Sidebar.jsx
│       ├── hooks/                    # Custom React hooks
│       ├── utils/                    # Utilities (auth, API clients)
│       ├── constants/                # Navigation, seed data
│       └── auth.js                   # NextAuth config
│
├── mobile/
│   └── src/
│       ├── app/
│       │   ├── _layout.jsx           # Root layout (Stack navigator)
│       │   ├── login.jsx             # Login screen (first screen)
│       │   ├── index.jsx             # Dashboard
│       │   ├── inbox.jsx             # Inbox screen
│       │   ├── tasks.jsx             # Tasks screen
│       │   ├── memory.jsx            # Memory screen
│       │   ├── persona.jsx           # Persona screen
│       │   ├── settings.jsx          # Settings screen
│       │   ├── rules.jsx             # Rules screen
│       │   ├── integrations.jsx      # Integrations screen
│       │   └── activity.jsx          # Activity log screen
│       ├── components/
│       │   ├── VlosaActionOverlay.jsx    # Spin overlay UI
│       │   └── KeyboardAvoidingAnimatedView.jsx
│       └── utils/
│           ├── auth/                 # Auth utilities (WebView, hooks)
│           ├── losApi.js             # API client
│           ├── neu.jsx               # Neumorphic components
│           ├── theme.jsx             # Theme constants
│           └── useVlosaActionOverlay.jsx  # Overlay hook
│
└── README.md                         # This file
```

---

## Database Schema

### Core Tables

#### `los_user_profiles`
Stores extended user profile information beyond auth.

| Column      | Type   | Description                    |
|-------------|--------|--------------------------------|
| id          | uuid   | Primary key                    |
| email       | text   | Unique email (matches auth)    |
| user_id     | text   | Auth user ID reference         |
| first_name  | text   | User's first name              |
| last_name   | text   | User's last name               |
| phone       | text   | Phone number                   |
| created_at  | timestamp | Creation timestamp          |
| updated_at  | timestamp | Last update timestamp       |

#### `los_inbox_items`
Email messages synced from Gmail or created manually.

| Column           | Type      | Description                          |
|------------------|-----------|--------------------------------------|
| id               | uuid      | Primary key                          |
| profile_key      | text      | User identifier                      |
| user_id          | text      | Auth user ID                         |
| source           | text      | 'gmail' or 'manual'                  |
| external_id      | text      | Gmail message ID                     |
| from_name        | text      | Sender name                          |
| from_address     | text      | Sender email                         |
| subject          | text      | Email subject                        |
| body_text        | text      | Email body                           |
| priority         | text      | urgent/important/routine/low         |
| status           | text      | incoming/ai_draft/approved/sent      |
| ai_summary       | text      | AI-generated summary                 |
| suggested_reply  | text      | AI-generated draft reply             |
| created_at       | timestamp | Creation timestamp                   |
| updated_at       | timestamp | Last update timestamp                |

#### `los_tasks`
Tasks and action items.

| Column      | Type      | Description                          |
|-------------|-----------|--------------------------------------|
| id          | uuid      | Primary key                          |
| profile_key | text      | User identifier                      |
| user_id     | text      | Auth user ID                         |
| title       | text      | Task title                           |
| status      | text      | incoming/approved/in_progress/completed/rejected |
| priority    | text      | urgent/important/routine/low         |
| due_at      | timestamp | Due date/time (nullable)             |
| created_at  | timestamp | Creation timestamp                   |
| updated_at  | timestamp | Last update timestamp                |

#### `los_memory`
Long-term context and information storage.

| Column      | Type      | Description                          |
|-------------|-----------|--------------------------------------|
| id          | uuid      | Primary key                          |
| profile_key | text      | User identifier                      |
| user_id     | text      | Auth user ID                         |
| content     | text      | Memory content                       |
| pinned      | boolean   | Is pinned (priority memory)          |
| source      | text      | Where memory came from               |
| created_at  | timestamp | Creation timestamp                   |

#### `los_persona`
User's communication persona/style.

| Column             | Type      | Description                          |
|--------------------|-----------|--------------------------------------|
| id                 | bigint    | Primary key                          |
| profile_key        | text      | User identifier (unique)             |
| user_id            | text      | Auth user ID                         |
| tone               | text      | Communication tone                   |
| structure          | text      | Response structure preferences       |
| values_and_beliefs | text      | Core values                          |
| phrases_allow      | text      | Preferred phrases                    |
| phrases_block      | text      | Phrases to avoid                     |
| created_at         | timestamp | Creation timestamp                   |
| updated_at         | timestamp | Last update timestamp                |

#### `los_settings`
User settings and rules configuration.

| Column              | Type      | Description                          |
|---------------------|-----------|--------------------------------------|
| id                  | bigint    | Primary key                          |
| profile_key         | text      | User identifier (unique)             |
| user_id             | text      | Auth user ID                         |
| theme_preference    | text      | 'light', 'dark', or 'system'         |
| automation_posture  | text      | 'approval_first' or 'auto_run'       |
| quiet_hours_start   | time      | Quiet hours start time               |
| quiet_hours_end     | time      | Quiet hours end time                 |
| rules               | jsonb     | Granular rule toggles                |
| created_at          | timestamp | Creation timestamp                   |
| updated_at          | timestamp | Last update timestamp                |

**Rules JSONB Structure:**
```json
{
  "email": {
    "draftEmailsAutomatically": true,
    "sendEmailsWithoutApproval": false,
    "neverRespondToUnknownNumbers": false,
    "allowedCommunicationWindowStart": "09:00",
    "allowedCommunicationWindowEnd": "17:00"
  },
  "calls": {
    "scheduleCallsAutomatically": false,
    "neverAcceptUnknownCallers": false
  }
}
```

#### `los_integrations`
External service connections (Gmail, etc.).

| Column           | Type      | Description                          |
|------------------|-----------|--------------------------------------|
| id               | uuid      | Primary key                          |
| profile_key      | text      | User identifier                      |
| user_id          | text      | Auth user ID                         |
| provider         | text      | 'gmail'                              |
| email_address    | text      | Connected email address              |
| access_token     | text      | OAuth access token                   |
| refresh_token    | text      | OAuth refresh token                  |
| token_expires_at | timestamp | Token expiration                     |
| scopes           | text      | Granted scopes                       |
| metadata         | jsonb     | Additional data (e.g., historyId)    |
| created_at       | timestamp | Creation timestamp                   |
| updated_at       | timestamp | Last update timestamp                |

#### `los_activity_log`
Audit trail of all system actions.

| Column       | Type      | Description                          |
|--------------|-----------|--------------------------------------|
| id           | bigint    | Primary key                          |
| profile_key  | text      | User identifier                      |
| user_id      | text      | Auth user ID                         |
| action_type  | text      | Type of action                       |
| message      | text      | Human-readable description           |
| metadata     | jsonb     | Additional context                   |
| created_at   | timestamp | Action timestamp                     |

#### `los_oauth_states`
Temporary OAuth state storage for security.

| Column      | Type      | Description                          |
|-------------|-----------|--------------------------------------|
| state       | text      | OAuth state token (primary key)      |
| profile_key | text      | User identifier                      |
| provider    | text      | OAuth provider                       |
| created_at  | timestamp | Creation timestamp                   |

### Auth Tables (NextAuth.js)
- `auth_users`: Core user accounts
- `auth_accounts`: OAuth provider linkage
- `auth_sessions`: Active sessions
- `auth_verification_token`: Email verification

---

## Setup & Installation

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **PostgreSQL** database (or Neon account)
- **Gmail API** credentials (for integration)
- **OpenAI API** key (for AI features)

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd apps

# Install dependencies (both web and mobile)
cd web && npm install
cd ../mobile && npm install
```

### Step 2: Database Setup

1. Create a PostgreSQL database (locally or via Neon)
2. Run the schema migration (see `Database Schema` section above)
3. Set `DATABASE_URL` in your environment

### Step 3: Environment Variables

Create `.env.local` files in both `/apps/web` and `/apps/mobile`:

**Web (`/apps/web/.env.local`):**
```env
DATABASE_URL=postgresql://user:password@host/database
AUTH_SECRET=your-random-secret-min-32-chars
AUTH_URL=http://localhost:5173

# Gmail OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Anything platform (auto-set)
NEXT_PUBLIC_CREATE_APP_URL=http://localhost:5173
```

**Mobile (`/apps/mobile/.env.local`):**
```env
EXPO_PUBLIC_BASE_URL=http://localhost:5173
EXPO_PUBLIC_PROXY_BASE_URL=http://localhost:5173
```

### Step 4: Run Development Servers

**Web:**
```bash
cd web
npm run dev
# Opens at http://localhost:5173
```

**Mobile:**
```bash
cd mobile
npx expo start
# Scan QR code with Expo Go app
```

### Step 5: Create Your First Account

1. Go to `http://localhost:5173`
2. You'll be redirected to `/account/signup`
3. Fill in: First Name, Last Name, Phone, Email, Password
4. Watch the VLOSA logo spin for 3 seconds while "Signing up…"
5. You'll land on the dashboard!

---

## Environment Variables

### Platform-Managed (Auto-Set by Anything)
These are automatically provided:
- `NEXT_PUBLIC_CREATE_APP_URL`
- `NEXT_PUBLIC_CREATE_ENV`
- `EXPO_PUBLIC_PROXY_BASE_URL`
- `EXPO_PUBLIC_BASE_URL`
- `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_CREATE_ENV`
- `NODE_ENV`
- `STRIPE_SECRET_KEY` (if Stripe integration enabled)
- `AUTH_SECRET` (generated for NextAuth)
- `AUTH_URL` (set to your app URL)

### User-Configured
These you must set:
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_CLIENT_ID`: Gmail OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Gmail OAuth client secret
- `OPENAI_API_KEY`: OpenAI API key for AI drafts

---

## Authentication

### Flow Overview

VLOSA uses **NextAuth.js** with email/password authentication.

#### Web Flow
1. User visits any page
2. If not authenticated → redirect to `/account/signin?callbackUrl=/`
3. User enters email/password
4. Form disappears → VLOSA logo spins + "Signing in…"
5. After 3 seconds → auth completes → redirect to dashboard

#### Mobile Flow
1. App opens on `/login` screen (first screen)
2. User presses "Sign in"
3. Logo spins + "Signing in…" for 3 seconds
4. `AuthWebView` modal opens showing web signin page
5. User authenticates in the WebView
6. WebView detects success → extracts session token
7. Modal closes → redirects to dashboard

### Session Management
- **Web**: Cookie-based sessions via NextAuth.js
- **Mobile**: Token stored in `SecureStore`, sent as `Authorization: Bearer <token>` header
- **Expiry**: 30 days by default (configurable in `/apps/web/src/auth.js`)

### Protected Routes
- **Web**: `/` (dashboard) auto-redirects to `/account/signin` if not logged in
- **Mobile**: All screens except `/login` check `isAuthenticated` and redirect if needed

### User Profile
Extended profile data (first/last name, phone) is stored in `los_user_profiles` and created during signup.

---

## Core Concepts

### Profile Key
Every user has a `profile_key` (their email) that ties together all their data:
- Inbox items
- Tasks
- Memory
- Persona
- Settings
- Activity logs

This allows multi-tenancy and data isolation.

### Automation Posture
Controls how VLOSA behaves:

**`approval_first` (default):**
- AI generates drafts, but you must approve before sending
- Tasks created but require approval before execution
- Maximum human control

**`auto_run`:**
- Combined with granular rules, actions can execute automatically
- Example: `sendEmailsWithoutApproval: true` → AI drafts are sent immediately
- Use with caution!

### Priority Levels
Used for both inbox items and tasks:
- **urgent**: Needs immediate attention
- **important**: High priority, but not time-critical
- **routine**: Normal priority
- **low**: Can wait

### Status Workflows

**Inbox:**
- `incoming` → new message
- `ai_draft` → AI has generated a suggested reply
- `approved` → user approved the draft
- `sent` → reply sent via Gmail

**Tasks:**
- `incoming` → new task
- `approved` → approved for execution
- `in_progress` → being worked on
- `completed` → done
- `rejected` → declined

### Rules Engine
The Rules Engine enforces behavioral constraints:

#### Quiet Hours
- Defined by `quiet_hours_start` and `quiet_hours_end` in settings
- Blocks all communication actions (draft, send) during this window
- Returns `403` error: "Quiet hours are active..."

#### Communication Windows
- Email-specific allowed hours (`allowedCommunicationWindowStart/End`)
- More granular than quiet hours
- Example: Allow emails 9am-5pm, but quiet hours are 10pm-7am

#### Rule Checks (enforced in backend)
Example from `/api/los/inbox/[id]/send/route.js`:

```javascript
// 1. Check quiet hours
if (isQuietHours(settings)) {
  return Response.json({ error: 'Quiet hours active...' }, { status: 403 });
}

// 2. Check communication window
if (!isWithinCommunicationWindow(settings, 'email')) {
  return Response.json({ error: 'Outside allowed hours...' }, { status: 403 });
}

// 3. Check approval requirement
if (posture !== 'auto_run' || !rules.email.sendEmailsWithoutApproval) {
  if (item.status !== 'approved') {
    return Response.json({ error: 'Item not approved...' }, { status: 403 });
  }
}
```

---

## API Documentation

All API routes are in `/apps/web/src/app/api/`.

### Authentication Required
Most endpoints require a valid session. On error:
- **401**: Not authenticated
- **403**: Authenticated but action blocked by rules

### User Profile

#### `POST /api/los/user-profile`
Create or update user profile (public during signup).

**Body:**
```json
{
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

#### `GET /api/los/user-profile`
Fetch current user's profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### `PATCH /api/los/user-profile`
Update current user's profile.

**Body:**
```json
{
  "firstName": "Janet",
  "phone": "+9876543210"
}
```

### Inbox

#### `GET /api/los/inbox`
List inbox items.

**Query Params:**
- `limit` (default: 50)
- `status`: filter by status

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "subject": "Meeting tomorrow",
      "from_name": "Bob",
      "from_address": "bob@example.com",
      "priority": "important",
      "status": "incoming",
      "ai_summary": "Bob wants to schedule a meeting.",
      "suggested_reply": null,
      "created_at": "2026-03-23T10:00:00Z"
    }
  ]
}
```

#### `POST /api/los/inbox`
Create a new inbox item manually.

**Body:**
```json
{
  "subject": "Task reminder",
  "body_text": "Don't forget to...",
  "priority": "routine"
}
```

#### `GET /api/los/inbox/[id]`
Get single inbox item.

#### `PATCH /api/los/inbox/[id]`
Update inbox item.

**Body:**
```json
{
  "status": "approved",
  "priority": "urgent"
}
```

#### `DELETE /api/los/inbox/[id]`
Delete inbox item.

#### `POST /api/los/inbox/[id]/ai-draft`
Generate AI-powered reply draft.

**Rules Enforced:**
- Quiet hours
- Communication window
- `draftEmailsAutomatically` setting
- Unknown sender blocking

**Response:**
```json
{
  "suggested_reply": "Hi Bob,\n\nThat works for me. Let's meet at 2pm.\n\nBest,\nJane"
}
```

#### `POST /api/los/inbox/[id]/send`
Send email via Gmail.

**Body:**
```json
{
  "replyText": "Hi Bob, sounds good!"
}
```

**Rules Enforced:**
- Quiet hours
- Communication window
- Approval requirement (unless auto-run + sendWithoutApproval)

**Response:**
```json
{
  "success": true,
  "gmailMessageId": "18f3abc..."
}
```

### Tasks

#### `GET /api/los/tasks`
List tasks.

**Query Params:**
- `status`: filter by status

#### `POST /api/los/tasks`
Create task.

**Body:**
```json
{
  "title": "Review Q1 report",
  "priority": "important",
  "due_at": "2026-03-30T17:00:00Z"
}
```

#### `GET /api/los/tasks/[id]`
Get single task.

#### `PATCH /api/los/tasks/[id]`
Update task.

**Body:**
```json
{
  "status": "completed"
}
```

#### `DELETE /api/los/tasks/[id]`
Delete task.

### Memory

#### `GET /api/los/memory`
List memory items.

#### `POST /api/los/memory`
Create memory.

**Body:**
```json
{
  "content": "Prefers morning meetings",
  "pinned": true,
  "source": "manual"
}
```

#### `PATCH /api/los/memory/[id]`
Update memory.

#### `DELETE /api/los/memory/[id]`
Delete memory.

### Persona

#### `GET /api/los/persona`
Get persona.

#### `POST /api/los/persona`
Create or update persona.

**Body:**
```json
{
  "tone": "Professional but warm",
  "structure": "Start with greeting, keep concise",
  "values_and_beliefs": "Respect others' time, clear communication",
  "phrases_allow": "happy to help, let me know",
  "phrases_block": "just checking in, circle back"
}
```

### Settings

#### `GET /api/los/settings`
Get settings.

#### `POST /api/los/settings`
Create or update settings.

**Body:**
```json
{
  "theme_preference": "dark",
  "automation_posture": "approval_first",
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "07:00",
  "rules": {
    "email": {
      "draftEmailsAutomatically": true,
      "sendEmailsWithoutApproval": false,
      "allowedCommunicationWindowStart": "09:00",
      "allowedCommunicationWindowEnd": "17:00"
    }
  }
}
```

### Activity Log

#### `GET /api/los/activity`
List activity logs.

**Query Params:**
- `limit` (default: 100)

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "action_type": "inbox.ai_draft",
      "message": "AI draft generated for: Meeting tomorrow",
      "created_at": "2026-03-23T10:15:00Z"
    }
  ]
}
```

### Gmail Integration

#### `GET /api/integrations/gmail/status`
Check Gmail connection status.

**Response:**
```json
{
  "connected": true,
  "email": "user@gmail.com"
}
```

#### `GET /api/integrations/gmail/connect`
Initiate Gmail OAuth flow (redirects to Google).

#### `GET /api/integrations/gmail/callback`
OAuth callback handler (handles Google redirect).

#### `POST /api/integrations/gmail/sync`
Sync emails from Gmail.

**Body:**
```json
{
  "maxResults": 20
}
```

**Response:**
```json
{
  "synced": 5,
  "newItems": 3,
  "updatedItems": 2
}
```

#### `POST /api/integrations/gmail/disconnect`
Disconnect Gmail integration.

---

## Integrations

### Gmail

#### Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project

2. **Enable Gmail API**
   - Navigate to "APIs & Services" → "Library"
   - Search "Gmail API" → Enable

3. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:5173/api/integrations/gmail/callback` (dev)
     - `https://yourdomain.com/api/integrations/gmail/callback` (prod)

4. **Set Environment Variables**
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

#### OAuth Flow

1. User clicks "Connect Gmail" in Integrations
2. Backend generates OAuth URL with state token
3. User redirects to Google consent screen
4. Google redirects back to `/api/integrations/gmail/callback`
5. Backend exchanges code for tokens
6. Tokens stored in `los_integrations` table
7. User redirected back to app

#### Scopes Requested
- `https://www.googleapis.com/auth/gmail.readonly`: Read emails
- `https://www.googleapis.com/auth/gmail.send`: Send emails
- `https://www.googleapis.com/auth/gmail.modify`: Mark as read, archive

#### Sync Strategy

**Initial Sync:**
- Fetches last 20 messages
- Creates inbox items with `source='gmail'` and `external_id=<gmail_message_id>`
- Stores Gmail `historyId` for incremental sync

**Incremental Sync:**
- Uses Gmail History API
- Only fetches changes since last `historyId`
- More efficient than re-fetching all messages

**Deduplication:**
- Unique index on `(profile_key, source, external_id)`
- Prevents duplicate inbox items from same Gmail message

### AI (OpenAI GPT)

Used for AI draft generation in `/api/los/inbox/[id]/ai-draft`.

**Prompt Construction:**
```javascript
const systemPrompt = `You are an AI assistant helping draft email replies.
Persona: ${persona.tone}
Structure: ${persona.structure}
Values: ${persona.values_and_beliefs}
Use these phrases: ${persona.phrases_allow}
Avoid these phrases: ${persona.phrases_block}

Context from memory:
${memoryItems.map(m => m.content).join('\n')}
`;

const userPrompt = `Original email from ${item.from_name}:
Subject: ${item.subject}
${item.body_text}

Draft a reply.`;
```

**Model:** `gpt-4` (configurable)

**Temperature:** 0.7 (balanced creativity)

---

## UI/UX Patterns

### VLOSA Spin Overlay

The signature UX pattern: whenever an important action is triggered, the screen clears and shows only:
- **VLOSA logo** (spinning for 3 seconds minimum)
- **Status line** (e.g., "Signing in…", "Sending email…")

#### Implementation

**Web:**
- State: `isSpinning`, `spinStatus`
- When `isSpinning === true`: entire form/content is hidden
- Only logo + status shown, centered

**Mobile:**
- Hook: `useVlosaActionOverlay(tokens)`
- Method: `runWithOverlay(statusText, asyncFunction)`
- Component: `<VlosaActionOverlay visible={isVisible} status={status} />`
- Full-screen opaque overlay with centered logo

#### Usage Example (Mobile)

```javascript
import useVlosaActionOverlay from '@/utils/useVlosaActionOverlay';

const { runWithOverlay } = useVlosaActionOverlay(tokens);

const handleSave = async () => {
  await runWithOverlay('Saving…', async () => {
    await losApi.createTask(tokens, { title: 'New task' });
  });
};
```

#### Minimum 3-Second Guarantee
All overlays spin for **at least 3 seconds**, even if the API call finishes faster. This creates a consistent, non-jarring UX.

### Neumorphic Design

VLOSA uses a **neumorphic (soft UI)** design language:

**NeuContainer:**
- Soft shadows (inset and outset)
- Subtle borders
- Low-contrast backgrounds

**NeuButton:**
- Pressed state: inset shadow
- Hover state: subtle lift
- Consistent padding and radius

**NeuInput:**
- Inset appearance
- Gentle focus ring
- Placeholder styling

**Color Palette:**
- Background: `#E8EDF2` (light), `#1A1F2E` (dark)
- Text: `#2C3E50` (light), `#E5E7EB` (dark)
- Accent: `#3498DB` (blue)
- Error: `#E74C3C` (red)
- Success: `#2ECC71` (green)

### Error Handling

**Styled Error Display:**
- Neumorphic inset red box
- Icon (Lucide `AlertCircle`)
- Clear, human-friendly message
- Auto-dismissable or persistent (depending on context)

**Example (Web):**
```jsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-inner">
    <div className="flex items-start gap-3">
      <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
      <p className="text-red-700 text-sm">{error}</p>
    </div>
  </div>
)}
```

**Example (Mobile):**
```jsx
{error && (
  <View style={{ backgroundColor: '#FEE2E2', padding: 16, borderRadius: 16 }}>
    <Text style={{ color: '#DC2626' }}>{error}</Text>
  </View>
)}
```

### Loading States

**Web:**
- Spinner components from `lucide-react` (`Loader2`)
- Skeleton screens for data-heavy views
- VLOSA spin overlay for actions

**Mobile:**
- `<ActivityIndicator />` for inline loading
- Full-screen VLOSA overlay for actions

---

## Development Guidelines

### Code Style

- **JavaScript**: ES6+ syntax, async/await preferred
- **React**: Functional components + hooks (no class components)
- **Naming**:
  - Components: PascalCase (`InboxView.jsx`)
  - Utilities: camelCase (`losApi.js`)
  - Constants: UPPER_SNAKE_CASE (`NAVIGATION_ITEMS`)

### File Organization

- **Shared logic** → `/utils/`
- **React hooks** → `/hooks/`
- **API routes** → `/app/api/<domain>/`
- **Components** → `/components/` (web) or adjacent to screens (mobile)

### Database Access

**Always use the `sql` tagged template:**

```javascript
import sql from '@/app/api/utils/sql';

// ✅ Good: tagged template
const rows = await sql`SELECT * FROM los_tasks WHERE profile_key = ${profileKey}`;

// ✅ Good: function form for dynamic queries
const rows = await sql('SELECT * FROM los_tasks WHERE id = $1', [taskId]);

// ❌ Bad: nesting sql calls
const rows = await sql`SELECT * FROM ${sql`los_tasks`}`; // WRONG
```

**Transactions:**
```javascript
const [result1, result2] = await sql.transaction([
  sql`INSERT INTO los_tasks (...) VALUES (...)`,
  sql`UPDATE los_settings SET ... WHERE ...`
]);
```

### API Client Pattern

Both web and mobile use a shared `losApi.js` pattern:

```javascript
export const losApi = {
  async getTasks(tokens, { status } = {}) {
    const url = new URL('/api/los/tasks', base);
    if (status) url.searchParams.set('status', status);
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokens.sessionToken}` }
    });
    
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    
    return res.json();
  }
};
```

### React Query Pattern

**Web and mobile both use `@tanstack/react-query`:**

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
const { data: tasks, isLoading } = useQuery({
  queryKey: ['tasks', { status: 'incoming' }],
  queryFn: () => losApi.getTasks(tokens, { status: 'incoming' })
});

// Mutate data
const queryClient = useQueryClient();
const createTask = useMutation({
  mutationFn: (newTask) => losApi.createTask(tokens, newTask),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }
});
```

### Mobile Navigation

Use `expo-router`:

```javascript
import { router } from 'expo-router';

// Navigate to a screen
router.push('/inbox');

// Navigate with params
router.push(`/inbox?itemId=${item.id}`);

// Go back
router.back();
```

### Error Boundaries

Wrap key sections in error boundaries (both web and mobile):

```javascript
try {
  await someApiCall();
} catch (err) {
  console.error('Failed:', err);
  setError(err.message || 'Something went wrong');
}
```

---

## Deployment

### Web Deployment

**Platform:** Anything platform (Vite + serverless functions)

**Build Command:**
```bash
npm run build
```

**Environment Variables:**
Ensure all required env vars are set in production:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL` (your production domain)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`

**Post-Deployment:**
1. Update Gmail OAuth redirect URIs to include production domain
2. Test authentication flow end-to-end
3. Verify database connection

### Mobile Deployment

**Platform:** Expo Application Services (EAS)

**Build for iOS:**
```bash
eas build --platform ios
```

**Build for Android:**
```bash
eas build --platform android
```

**Environment Variables:**
Set in `eas.json` or via EAS Secrets:
- `EXPO_PUBLIC_BASE_URL` (production web API URL)

**App Store Submission:**
- Ensure all required permissions are declared (`Info.plist`, `AndroidManifest.xml`)
- Test OAuth flow on physical devices
- Submit via App Store Connect (iOS) / Google Play Console (Android)

### Database Migrations

When adding new tables or columns:

1. Write migration SQL
2. Test locally
3. Run on production database (via Neon console or migration tool)
4. Deploy application code that uses new schema

**Best Practice:** Use a migration tool like `node-pg-migrate` or Neon's branching feature.

---

## Future Roadmap

### Planned Features

- **Calendar Integration**: Sync Google Calendar, schedule meetings automatically
- **SMS/Phone Integration**: Twilio integration for call/text management
- **Advanced AI**:
  - Multi-turn conversations with context
  - Sentiment analysis for priority classification
  - Learning from user feedback (approved vs. rejected drafts)
- **Team Collaboration**: Multi-user workspaces, shared inboxes
- **Mobile Push Notifications**: Real-time alerts for urgent items
- **Voice Interface**: Voice commands for task creation, email dictation
- **Analytics Dashboard**: Insights into communication patterns, productivity metrics
- **Third-Party Integrations**:
  - Slack, Microsoft Teams
  - Asana, Trello (task sync)
  - Zoom, Google Meet (meeting scheduling)
- **Custom Workflows**: User-defined automation sequences (Zapier-style)
- **Security Enhancements**:
  - Two-factor authentication
  - End-to-end encryption for sensitive data
  - Audit log export

### Technical Debt
- Add comprehensive test coverage (Jest, React Testing Library, Playwright)
- Implement proper database migrations tooling
- Add rate limiting to API endpoints
- Optimize mobile app bundle size
- Implement background sync for mobile (when app is closed)

---

## Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes, test locally (web + mobile)
3. Commit with clear messages: `git commit -m "Add: AI draft improvements"`
4. Push and create PR

### Code Review Checklist

- [ ] All new API endpoints have proper authentication checks
- [ ] Rules Engine enforcement is applied where needed
- [ ] Error messages are user-friendly
- [ ] Loading states use VLOSA spin overlay for consistency
- [ ] Database queries use parameterized `sql` template (no SQL injection)
- [ ] Mobile + web both tested (if applicable)
- [ ] Activity logging added for new actions
- [ ] README updated if new features/endpoints added

---

## License

MIT License — see LICENSE file for details.

---

## Support

For issues, questions, or feature requests:
- **GitHub Issues**: [your-repo-url]/issues
- **Email**: jerathelczerny@yahoo.com
- **Documentation**: This README + inline code comments

---

**Built with ❤️ by the VLOSA team**

*Last updated: March 23, 2026*



