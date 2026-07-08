# 🎓 AI Study Abroad Counselor & CRM Dashboard

A production-ready, secure, and feature-rich Next.js web application designed to guide students through the **15-Phase Study Abroad Admissions Journey**. The application features an intelligent agentic chatbot powered by **Google Gemini**, semantic search capabilities via **pgvector RAG**, an interactive student checklist, a real-time **Counselor Live Chat & Takeover Queue**, and an **Admin Dashboard** for performance tracking and document indexing.

---

## 🏗️ Architecture Overview

The system combines Next.js App Router API routes, PostgreSQL (via Prisma), and Google GenAI models.

```mermaid
graph TD
    User[Client Browser] --> NextRoute[Next.js API Routes]
    NextRoute --> RateLimit[IP Rate Limiter & Abuse DB Ban]
    NextRoute --> Auth[NextAuth Session Verification]
    NextRoute --> CostCheck[Daily User Cost Budget Check]
    NextRoute --> GeminiAgent[Gemini API Agentic Loop]
    GeminiAgent --> Tools[Function Calling Tools]
    Tools --> CRM[PostgreSQL DB via Prisma]
    Tools --> RAG[pgvector Semantic Search]
    NextRoute --> SSE[Server-Sent Events Stream]
    SSE --> User
```

---

## ⚡ Key Features

### 1. Agentic AI & Tool Call Integration
- Powered by the **Google GenAI SDK** (Gemini 2.5 Flash / 3.1 Flash-Lite).
- Operates with an autonomous agentic loop utilizing function calling:
  - `query_crm_api`: Retrieves pre-loaded student GPA, test scores, and target intake terms.
  - `recommend_universities`: Automatically ranks and maps Safe, Target, and Reach matching programs.
  - `update_student_profile`: Syncs checklist changes directly to the database.
  - `search_vector_store`: Retrieves local institutional brochures and policy handbooks.
  - `escalate_to_counselor`: Bridges the student to live counselor human support.

### 2. Live Counselor Takeover Dashboard
- Counselor dashboard fetches the escalation queue in real-time.
- Chime chimes (via custom `AudioContext` oscillators) sound on incoming escalations.
- **Takeover Bridge**: Counselor takes over the session, pausing the AI. Messages are safely routed directly between the user and the human counselor.
- **Feedback Loop**: When a chat closes, students provide a 1-5 star satisfaction score, recalculating the counselor's moving average performance.

### 3. Industrial Security & Cost Controls
- **IP Rate Limiting**: Sliding window restriction (10 requests/minute) stored in-memory.
- **Automated IP Bans**: IPs exceeding abuse thresholds (30 requests/minute) are banned for 24 hours in the PostgreSQL `BannedIp` table.
- **Token Cost Control**: Evaluates user message cost bounds in the last 24 hours. Requests are blocked if spending exceeds **$0.50/day per user**.
- **PII Compliance Scanner**: Scans uploaded document text (in-memory) for sensitive markers (passports, Aadhaar, PAN cards, SSNs, bank info, credit cards). Triggers instant deletion if detected.
- **CSRF Validation**: Enforces origin check validation on all mutating API routes.

---

## 📂 Project Structure

```text
├── prisma/
│   ├── schema.prisma       # Database blueprints (User, Session, Messages, Metrics, Bans)
│   └── seed.ts             # Admin and RAG document seeder script
├── src/
│   ├── app/
│   │   ├── (chat)/         # Student Chat interface UI
│   │   ├── api/            # Route Handlers (Stream, Feedback, Escalations, Docs, Auth)
│   │   └── dashboard/      # Counselor live queue & Admin Performances dashboards
│   ├── components/         # Reusable layouts (Conversation bubble, Notification bell, Navigation)
│   ├── context/            # ChatContext managing state synchronization
│   ├── lib/
│   │   ├── AI_instructions.ts  # Persona guidelines, 15-phase funnel rules
│   │   ├── csrf.ts             # CSRF validation middleware
│   │   ├── escalation.ts       # Outside working hours queue resolver
│   │   ├── gemini.ts           # Gemini key rotation, model fallback, backoff client wrapper
│   │   ├── pii-scanner.ts      # In-memory regex PII scanner
│   │   ├── rag.ts              # pgvector semantic query parser
│   │   ├── rate-limit.ts       # IP & token spend limiter
│   │   └── sanitize.ts         # User input sanitizer
│   └── __tests__/          # Vitest Unit and Integration tests
```

---

## 🧪 Testing & Code Coverage

The codebase is backed by **Vitest** testing configurations and coverage validation.

### Run Tests
```bash
npm run test
```

### Run Coverage Analysis
```bash
npm run test:coverage
```

### Coverage Report Details:
- **`csrf.ts`**: 88.8% Line Coverage
- **`pii-scanner.ts`**: 100% Line Coverage
- **`rate-limit.ts`**: 97% Line Coverage
- **`escalation.ts`**: 100% Line Coverage
- **`AI_instructions.ts`**: 100% Line Coverage

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database with `vector` extension support.

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:pass@host:port/dbname?schema=public"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Gemini API Configurations
# Supports comma-separated keys for automatic key rotation
GEMINI_API_KEY="key1,key2,key3"
```

### 3. Installation
```bash
npm install
```

### 4. Database Setup & Seeding
```bash
# Push database schemas
npx prisma db push

# Seed database with default admin and documents
npm run seed:rag
```

### 5. Running Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.
