# Deep Architecture & File Breakdown

This is an exhaustive, file-by-file technical breakdown of every single file in the project.

## Root Configuration & Meta Files
- **`.env`**: Stores sensitive environment variables (e.g., `DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_GEMINI_API_KEY`, `PINECONE_API_KEY`, `NEXT_PUBLIC_APP_URL`).
- **`.gitignore`**: Specifies intentionally untracked files that Git should ignore (like `node_modules`, `.env`, `.next`).
- **`docker-compose.yml`**: Docker configuration file defining a PostgreSQL container (`postgres_db`) for local database development.
- **`eslint.config.mjs`**: ESLint configuration for code linting and enforcing TypeScript/React best practices.
- **`next.config.ts`**: The Next.js configuration file. Defines compiler options, redirects, and environment variables exposed to the build.
- **`next-env.d.ts`**: TypeScript declaration file ensuring Next.js types are picked up by the compiler.
- **`package.json` & `package-lock.json`**: Defines all npm dependencies (e.g., `next`, `react`, `prisma`, `@google/genai`, `pinecone-database`, `pdf-parse`), scripts (like `dev`, `build`, `start`), and the project version.
- **`postcss.config.mjs`**: Configuration for PostCSS, required by Tailwind CSS to process CSS files.
- **`prisma.config.ts`**: Configuration for Prisma ORM (often used for defining output schemas or custom generator logic).
- **`PROJECT_OVERVIEW.md`**: This exact file you are reading.
- **`README.md`**: The primary documentation file introducing the project.
- **`SRS.md`**: Software Requirements Specification. Contains the initial planning, goals, user roles, and feature requirements for the AI Counselor project.
- **`tsconfig.json` & `tsconfig.tsbuildinfo`**: TypeScript configuration, defining strict typing rules, path aliases (like `@/*`), and compilation targets.
- **`.vscode/settings.json`**: Workspace-specific settings for VSCode (e.g., format on save, default formatter).

## Prisma Database Architecture
- **`prisma/schema.prisma`**: The absolute blueprint of the PostgreSQL database. It defines the models:
  - `User`: Handles Students, Counselors, and Admins.
  - `Session`: Chat sessions linking a User to Messages. Contains the `status` (ACTIVE, PENDING_ESCALATION, ESCALATED_ACTIVE, CLOSED) and an optional `counselor_id`.
  - `Message`: Individual chat bubbles. Stores `content`, `sender_type` (USER, AI, COUNSELOR, SYSTEM).
  - `Document`: RAG metadata (title, text content, pinecone_id).
  - `CounselorPerformance`: Tracks total handled chats, average response time, and the moving average satisfaction score (1-5).
  - `MessageFeedback`: Tracks thumbs up/down (5 or 1) and the text reason for negative ratings on individual AI messages.
  - `Notification`: A global notification system for users (e.g., "Counselor has taken over").
- **`prisma/seed.ts`**: A script used during setup to insert an initial Admin user and some default documents into the database.

## Public Assets
- **`public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`, `src/app/favicon.ico`**: Static image assets and icons served at the root URL.

## Core Application (`src/app/`)
The Next.js App Router structure.

### Root Layout & Global CSS
- **`src/app/layout.tsx`**: The top-level HTML/Body wrapper. Initializes `SessionProvider` (NextAuth) and `ChatProvider` (Context) so auth and chat state wrap the entire application.
- **`src/app/globals.css`**: Contains Tailwind CSS directives (`@tailwind base`, etc.) and custom CSS rules (like custom scrollbars, gradient animations, and `.glass-input` styling).

### Authentication
- **`src/app/login/page.tsx`**: A dual-purpose UI handling both Login and Registration. It manages form states, posts to `/api/v1/auth/register`, and calls NextAuth's `signIn('credentials')`.
- **`src/app/api/auth/[...nextauth]/route.ts`**: The NextAuth configuration. Implements the `CredentialsProvider`, verifies hashed passwords via `bcryptjs`, and serializes the user `id` and `role` into the JWT token and session object.

### The Student Chat Interface (`src/app/(chat)/`)
- **`layout.tsx`**: Wraps the chat UI, providing the `Sidebar` on the left and the main chat area on the right.
- **`page.tsx`**: **The most complex UI file.** 
  - Manages the local `input` state for the chat.
  - Handles uploading documents (PDF/DOCX) using an invisible `<input type="file">`.
  - POSTs messages to `/api/v1/chat/stream` and parses the Server-Sent Events (SSE) chunks to create the typewriter effect.
  - Evaluates `activeSession.status`. If it is `CLOSED`, it hides the chat box and renders `<CounselorRating />`.
  - Maps through `activeSession.messages` and renders `<ConversationMessage />` components.

### The Staff Dashboard (`src/app/dashboard/`)
- **`layout.tsx`**: Wraps all dashboard pages with the `StaffNavigation` sidebar. Checks if the user is authorized.
- **`page.tsx`**: The main Counselor queue. Fetches `/api/v1/counselor/escalations` every 3 seconds. Renders a table of waiting students. When "Takeover" is clicked, it transforms into a live chat interface enabling human-to-human messaging via `/api/v1/counselor/messages`.
- **`performances/page.tsx`**: An Admin-only interface fetching `/api/v1/counselor/performances`. Renders a table showing total handled chats, average response time, and the 5-star satisfaction score.
- **`documents/page.tsx`**: An Admin-only interface for the RAG Knowledge Base. Uploads and deletes text/PDF documents to the Pinecone database via `/api/v1/admin/documents`.

---

## 🛠️ Deep API Routes (`src/app/api/`)

### Chat & AI Endpoints
- **`v1/chat/stream/route.ts`**:
  1. Checks authentication.
  2. If a file is uploaded, reads it, parses it via `pdf-parse`, and runs it through `scanForPII()`.
  3. Uses `getRelevantContext()` (Pinecone) to fetch context based on the user's prompt.
  4. Calls `google.genai.models.generateContentStream` with the system instruction (`AI_instructions.ts`), chat history, RAG context, and the current prompt.
  5. Monitors the stream for keywords like "escalated your" or "connecting you". If found, marks the session as `PENDING_ESCALATION` in PostgreSQL.
  6. Sends back generated UUIDs for the messages so the frontend can attach feedback to them.
- **`v1/chat/feedback/route.ts`**: Expects `messageId`, `rating`, and `feedbackReason`. Uses `prisma.messageFeedback.upsert` to save the student's rating of an AI response.
- **`v1/chat/counselor-rating/route.ts`**: Expects a 1-5 `rating`. Finds the counselor who handled the session, calculates the new moving average for their `satisfaction_score`, saves it in `CounselorPerformance`, and resets the session status to `ACTIVE`.
- **`v1/chat/file/route.ts`**: (Legacy/Helper) Specifically parses PDFs using `pdf-parse/lib/pdf-parse.js` to avoid bundling bugs.
- **`v1/chats/route.ts`**: Handles `GET` (return all sessions) and `POST` (create a new session) for the logged-in user.
- **`v1/chats/[id]/route.ts`**: Handles `DELETE` (removes session) and `PUT` (uses Gemini to generate a short title based on the first prompt).
- **`v1/chats/[id]/messages/route.ts`**: Handles `GET` to load history for an old chat.

### Counselor & Admin Endpoints
- **`v1/counselor/escalations/route.ts`**:
  - `GET`: Returns all sessions where status is `PENDING_ESCALATION` or `ESCALATED_ACTIVE`.
  - `POST (takeover)`: Assigns the counselor's ID to the session, inserts a `SYSTEM` message, and creates a `COUNSELOR_TAKEOVER` Notification for the student.
  - `POST (leave)`: Sets the session status to `CLOSED`, clears the counselor, inserts a `SYSTEM` disconnect message, and increments `total_handled` in `CounselorPerformance`.
- **`v1/counselor/messages/route.ts`**: Inserts a new `COUNSELOR` message. On the very first message sent in a session, it calculates `(Date.now() - session.updated_at)` to determine the response time, and updates `avg_response_sec` in `CounselorPerformance`. It also dispatches a `COUNSELOR_MESSAGE` notification.
- **`v1/counselor/performances/route.ts`**: Fetches the entire `CounselorPerformance` table, including counselor names/emails. Restricted to `ADMIN`.
- **`v1/admin/documents/route.ts`**: 
  - `GET`: Lists all documents.
  - `POST`: Generates embeddings for new text via `text-embedding-004`, pushes the vectors to Pinecone, and saves metadata in PostgreSQL.
  - `DELETE`: Removes the document from both Pinecone and PostgreSQL.
- **`v1/notifications/route.ts`**: 
  - `GET`: Fetches the latest 20 notifications for the user.
  - `PATCH`: Marks a specific notification (or all of them) as `is_read = true`.

---

## 🧩 Shared Components (`src/components/`)
- **`ConversationMessage.tsx`**: Takes a `message` object. Conditionally styles User messages (blue bubble, right aligned), AI messages (markdown parsed, left aligned), Counselor messages (outlined, left aligned), and System messages (centered gray text). It houses the Thumbs Up/Down SVG buttons and the text input for negative feedback.
- **`CounselorRating.tsx`**: A 5-star UI overlay. When a star is clicked, it POSTs to `/api/v1/chat/counselor-rating` and then calls `updateSessionStatus(sessionId, "ACTIVE")` via the ChatContext to seamlessly return the user to the chat.
- **`NotificationBell.tsx`**: Uses `setInterval` to fetch `/api/v1/notifications` every 15 seconds. If `unreadCount > 0`, adds a pulsing red dot. Clicking the bell renders an absolute-positioned dropdown menu mapping over notifications.
- **`ProfileMenu.tsx`**: Displays the user's initial. Uses a headless UI approach to show a dropdown for "Counselor Dashboard", "Toggle Dark Mode", and "Sign Out".
- **`Sidebar.tsx`**: Connects to `ChatContext`. Iterates over `sessions` to show chat history. Highlights the active session. Contains the "New Chat" button and a search bar to filter history.
- **`StaffNavigation.tsx`**: The dashboard sidebar. Checks `useSession` role to conditionally show the "Counselor Performances" link. It polls `/api/v1/counselor/escalations` every 3 seconds. If the `PENDING` count increases, it initializes an `AudioContext` and plays an oscillator chime (C6 -> E6).

---

## 🌐 Context & State (`src/context/`)
- **`ChatContext.tsx`**: The most critical frontend state file.
  - Provides a React Context exposing: `sessions`, `activeSessionId`, `createNewChat`, `updateActiveMessages`, `selectSession`, `deleteSession`, and `updateSessionStatus`.
  - Contains a `useEffect` that runs on mount to fetch `/api/v1/chats` from the database and populate the sidebar.
  - Handles the complex logic of automatically generating a title via API when a user sends their first message in a "New Chat".

---

## 🛠️ Core Utilities (`src/lib/` & root)
- **`src/auth.ts`**: Exports the NextAuth handlers (`GET`, `POST`, `auth`, `signIn`, `signOut`).
- **`src/proxy.ts`**: A global fetch override used internally in specific Next.js environments to map requests through a proxy.
- **`src/lib/AI_instructions.ts`**: A massive string literal providing the exact persona, rules, markdown formatting instructions, and escalation triggers ("I will connect you to a human counselor") for the Gemini model.
- **`src/lib/escalation.ts`**: Exports `resolveUnavailableEscalations()`. Checks if the current time is outside 9:00 AM - 5:30 PM. If it is, it finds all `PENDING_ESCALATION` sessions and automatically replies with a system message telling the user to come back during business hours, closing the queue.
- **`src/lib/pii-scanner.ts`**: Exports `scanForPII(text)`. Contains a series of Regex patterns matching phone numbers, SSNs, credit cards, passport formats, and emails. Returns an array of detected PII types.
- **`src/lib/prisma.ts`**: Exports `const prisma`. Prevents Next.js hot-reloading from creating hundreds of database connections by attaching the PrismaClient to `globalThis`.
- **`src/lib/rag.ts`**: Exports `getRelevantContext(query)`. Connects to the `@pinecone-database/pinecone` client, generates an embedding for the user's query using `google.genai`, and returns the top 3 semantically matched chunks of text to inject into the AI's prompt.
- **`src/lib/seed-rag.ts`**: A Node script that reads dummy texts (like tuition fees, visa requirements), chunks them into 1000-character blocks, generates embeddings, and inserts them into Pinecone to initialize the bot's knowledge.
