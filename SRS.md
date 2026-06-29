# Software Requirements Specification (SRS)
## AI-Powered Student Admission Counselor Chatbot (Enterprise Edition v1.0.0)

---

## Document Control & Executive Summary
**Document Information**
* **Project Name:** AI-Powered Student Admission Counselor Chatbot
* **Document Version:** 1.0.0 (Exhaustive Enterprise Revision)
* **Date:** 2026-06-27
* **Document Owner:** Siddhanth Rathore, Product Owner
* **Lead Architect:** Siddhanth Rathore
* **Architecture Platform:** Google Gemini (Antigravity)

**Revision History**
| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 0.1.0 | 2026-06-25 | Siddhanth Rathore | Initial Draft and Core Feature Outline. |
| 0.5.0 | 2026-06-26 | Siddhanth Rathore | Addition of UI Specs and Gemini Agentic Flows. |
| 1.0.0 | 2026-06-27 | Siddhanth Rathore | Unprecedented deep-dive enterprise expansion (15+ pages) detailing 15 APIs, 10 DB tables, and exhaustive edge cases. |

---

## 1. Introduction

### 1.1 Purpose & Vision
The purpose of this Software Requirements Specification (SRS) is to provide a clear and detailed software blueprint for the AI-Powered Student Admission Counselor Chatbot. This document serves as the main guide for the developer and stakeholders. 

This SRS also outlines a larger goal. Today, study abroad admission counselors spend too much time answering the same simple questions about deadlines, tuition fees, visa delays, housing, and course rules. Answering these basic questions stops them from having deep, helpful conversations with students that actually encourage them to enroll.

This application solves this problem by building a smart, friendly, and easy-to-use AI counselor powered by Google's Gemini LLM. The system will look and feel like ChatGPT, making it simple for students to use, while securely connecting to the consultancy's partner university databases. The main goal is to handle the repetitive work, reduce counselor stress, and give students accurate admission help 24/7 from anywhere in the world.

### 1.2 Document Conventions & Lexicon
To ensure absolute clarity for the developer, the following conventions are strictly adhered to throughout this 15+ page document:
*   **FR-xx**: Functional Requirement identifier. Used to track explicit features that define system behavior.
*   **NFR-xx**: Non-Functional Requirement identifier. Used to track performance, security, and scalability metrics.
*   **BR-xx**: Business Rule identifier. Used to define institutional policies that the software must implicitly obey.
*   **UC-xx**: Use Case identifier. Defines step-by-step actor-system interactions, including all alternate and failure paths.
*   **UI-xx**: User Interface specification identifier. Used to dictate exact pixel-level layouts and state transitions.
*   **API-xx**: Application Programming Interface endpoint identifier. Used to enforce strict backend-to-frontend contracts.
*   **Priority Levels:** Marked as **[High]** (Critical for MVP release), **[Medium]** (Important but can be deployed in a fast follow), or **[Low]** (Nice-to-have enhancements).
*   *Italics* are used for emphasis, specific UI button names (e.g., *Take Over Chat*), and technical terms upon their first use.
*   `Monospace` is used for code snippets, JSON payloads, database columns, HTTP headers, and HTTP status codes.

### 1.3 Intended Audience & Comprehensive Stakeholder Definitions
This document is written for a highly diverse array of stakeholders, each requiring profoundly different depths of technical and business context. The document is structured to serve them all:
1.  **Students & Parents (End-Users / Primary Actors):** Individuals interacting with the chatbot to gain clarity on admission processes, partner university deadlines, fee structures, and campus life. While they won't read this document, their detailed user personas dictate every UI/UX choice outlined in Section 2.
2.  **Admission Counselors (Secondary Actors):** Human staff members utilizing the secure counselor dashboard to monitor escalated chat queues, assume control of sensitive AI conversations, and guide students manually through complex visa or emotional situations. They will refer heavily to the UI and Use Case sections to completely understand their daily workflow.
3.  **System Administrators & IT Staff:** Security and infrastructure personnel responsible for managing API keys, fine-tuning RAG (Retrieval-Augmented Generation) document embeddings, managing Role-Based Access Control (RBAC), and monitoring Gemini API token usage budgets. They will refer exclusively to the Security, Deployment, and Database Schema sections.
4.  **Sole Developer:** Siddhanth Rathore, responsible for implementing the complex Next.js architecture, crafting the UI in TailwindCSS, and integrating the highly non-deterministic LLM logic. They rely on the API specifications, database schemas, and Mermaid architecture diagrams to write the code.
5.  **Quality Assurance (QA):** Responsible for verifying system edge cases, UI state transitions, API fault tolerance, and Agentic AI accuracy. They will utilize the Alternate Error Flows within the 15+ Use Cases to build robust, automated E2E test suites in Playwright or Cypress.
6.  **Data Governance & Authorization Team:** Data Protection Officers (DPO) and compliance personnel responsible for managing strict data authorization pipelines, auditing PII (Personally Identifiable Information) access, and enforcing data minimization policies under DPDP and GDPR. They will heavily rely on the Audit Events schema and the Business Rules section.

### 1.4 Exhaustive Project Scope
The application is a standalone, enterprise-grade web-based AI-driven assistant designed exclusively for prospective student engagement and conversion optimization. 

#### 1.4.1 In Scope (Phase 1 Deliverables)
*   Natural language multi-turn conversational AI powered directly by the Gemini LLM API via secure backend proxy.
*   Retrieval-Augmented Generation (RAG) utilizing a highly optimized Vector Database (Pinecone or PgVector) to ground AI responses entirely in verified institutional knowledge.
*   Agentic tool execution (dynamically querying live CRM data via internal REST APIs when a student asks about their specific application status).
*   A pixel-perfect, ChatGPT-style User Interface featuring a responsive Sidebar, historical Chat History tracking, seamless pagination, and real-time Streaming Text generation to lower perceived latency.
*   Real-time human counselor escalation mechanisms leveraging WebSockets or Server-Sent Events (SSE) to ensure zero dropped chats during handovers.
*   Comprehensive, deeply granular analytics reporting, token cost monitoring per session, and macro dashboard generation for administrators.
*   State-of-the-art Authentication and Authorization via stateless JWT and OAuth 2.0 (Google Workspace / Microsoft Entra integration).
*   Automated semantic titling of chat histories using secondary, fast LLM models.

#### 1.4.2 Out of Scope (Explicit Exclusions)
*   Direct processing of financial payments (e.g., tuition fees, application processing fees via Stripe/PayPal). The chatbot can only provide links to the payment portal.
*   Making definitive admission decisions, altering student grades, or issuing official electronic acceptance letters.
*   Integration with external social media messaging platforms (WhatsApp, Facebook Messenger, Instagram Direct) for the initial v1.0 release, to reduce security attack vectors.
*   Voice-to-Text or Text-to-Speech modalities. The system is strictly text-based for Phase 1.

#### 1.4.3 Technology Stack Mandates
*   **Frontend Framework:** Next.js (App Router paradigm), React 18+, TypeScript (strict mode enabled).
*   **Styling:** TailwindCSS v3+ with CSS Variables for theme switching.
*   **Backend Runtime:** Node.js 20+ (running within Next.js API Routes).
*   **Relational Database:** PostgreSQL 15+ (Hosted on AWS RDS or Supabase).
*   **Vector Database:** Pinecone (Serverless) or PgVector extension on PostgreSQL.
*   **AI Engine Engine:** Google Gemini Pro API (specifically models supporting `function_calling` / Agentic tools).
*   **Deployment & Infrastructure:** Dockerized containers deployed on Kubernetes, or serverless deployment via Vercel edge networks, utilizing GitHub Actions for strict CI/CD pipelines.

### 1.5 References and Rigorous Compliance Frameworks
To operate within the highly regulated education sector and align with our operations as an Indian company assisting global students, this application must adhere strictly to the following legal and technical frameworks:

*   **Digital Personal Data Protection Act, 2023 (DPDP) [India]:** As an Indian consultancy, this is our primary privacy framework. It governs the handling of student personal information, passport details, email addresses, phone numbers, academic records, and chat history.
*   **GDPR (General Data Protection Regulation) [EU]:** Applicable when we process data for European students, collaborate with European universities, or store data in European regions. Adhering to GDPR also serves as our global benchmark for data privacy, explicitly covering the "Right to be Forgotten" and user consent for tracking.
*   **FERPA (Family Educational Rights and Privacy Act) [USA]:** The system is designed to support FERPA requirements when applicable, particularly when integrating with or processing educational records for US educational institutions.
*   **WCAG 2.1 AA (Web Content Accessibility Guidelines):** Ensures the UI (specifically contrast ratios, full keyboard navigability without a mouse, and ARIA screen reader compatibility) is fully accessible to visually and physically disabled users.
*   **OAuth 2.0 & OpenID Connect:** The industry standard for secure federated identity management, used for Counselor and Admin SSO authentications.
*   **HTTPS / TLS 1.2+:** Mandatory standard for encrypting all data in transit to ensure secure communication between the client browser, our Next.js backend, and the Google Gemini API.
*   **OWASP Top 10:** The application architecture is designed to mitigate the most critical web application security risks, including robust protection against SQL Injection, Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), and Broken Authentication.
*   **Theme Identity Guidelines:** The foundational design system driving the exact color palette, typography, micro-animations, and visual identity of the chatbot UI to ensure brand consistency across domains.

---

## 2. Comprehensive User Interface (UI) Design Specifications

To ensure the application feels premium, trustworthy, and state-of-the-art, the user interface will meticulously mirror the layout, micro-interactions, and spatial patterns of ChatGPT, localized entirely with the specific, vibrant color branding inspired by Gradding.com.

### 2.1 Exhaustive Brand Theme & Color Palette Matrix
The UI will utilize the following specific hex codes to match the Gradding-like theme identity. The use of generic HTML colors (e.g., `blue`, `gray`) is strictly prohibited in the CSS stylesheets. **Crucially, while background and text colors will invert during Dark Mode, the primary brand blue (`#066AC9`) and secondary gradients MUST remain exactly the same to preserve brand consistency.**

*   **Primary Brand Blue (`#066AC9`):** This is the core accent color. It will be used for primary call-to-action (CTA) buttons, active UI states, user message bubbles, active input border highlights, and loading spinner strokes.
*   **Primary Hover State (`#055AAB`):** A slightly darker, 10% shaded version of the primary blue, used exclusively for button hovers to provide tactile visual feedback to the user.
*   **Primary Disabled State (`#066AC9` with 50% opacity):** Used when a button (like the Send button) cannot be clicked because the input is empty.
*   **Secondary Gradient (`linear-gradient(92.91deg, #1BA9BC, #2966C1)`):** A dynamic, highly premium Teal-to-Blue gradient. This will be used sparingly for promotional banners, the "AI thinking" skeleton loader state, and high-tier UI highlights (like the "New Chat" button background if configured).
*   **Background Base - Sidebar (`#EDEDED`):** A soft, light gray specifically chosen for the chat history sidebar. This creates spatial depth, distinguishing it from the main chat area while drastically reducing eye strain during long sessions.
*   **Background Base - Main Chat (`#FFFFFF`):** Pure, absolute white for the main conversational canvas to ensure maximum contrast for text readability.
*   **Text Primary (`#1F2022`):** A near-black dark gray used for all primary headings, AI message text, and sidebar text. This is chosen to avoid the harshness and eye fatigue associated with pure `#000000`.
*   **Text Secondary / Muted (`#989898` / `#B3B3B3`):** Used for timestamps, placeholder text inside input fields, and empty state sub-text.
*   **Success Green (`#538B19`):** Used strictly for positive feedback loops: successful human handover notifications, system alerts, and positive metric indicators on the admin dashboard.
*   **Error Red (`#D32F2F`):** Used strictly for destructive actions (Delete Chat) and critical network error alerts.
*   **Typography System:** The application will use a modern, highly legible sans-serif web font (e.g., `Inter`, `Roboto`, or `Quicksand`), defaulting to a `16px` base size (`1rem`) for maximum readability on mobile devices. Headings will scale using a modular typographic scale (1.25 ratio).

### 2.2 Global Layout Structure & Responsive Grid Behavior
The application layout is divided into two primary sections, utilizing modern CSS Grid and Flexbox for flawless responsive behavior across all device breakpoints.
1.  **Left Sidebar (Navigation & History):** 
    *   **Desktop (`>= 1024px`):** Fixed at exactly `260px` width on the left side of the screen.
    *   **Tablet/Mobile (`< 1024px`):** Hidden by default `transform: translateX(-100%)`. Accessible via a Hamburger Menu icon in the Top Header. When triggered, it slides in smoothly from the left (`transition: transform 0.3s ease`) with a semi-transparent black overlay (`#00000080`) covering the main chat area to trap focus.
2.  **Main Chat Area (Conversational Canvas):** 
    *   **Desktop:** Occupies the remaining `calc(100vw - 260px)` width and `100vh` height.
    *   **Tablet/Mobile:** Occupies 100% of the viewport width `100vw`.

### 2.3 Left Sidebar (Chat History & Navigation) Detailed Specs
This component houses the core navigation and history retrieval mechanics.

*   **UI-001: "New Chat" Button (Fixed Header):** 
    *   **Position:** Fixed at the absolute top of the sidebar with `16px` padding on all sides.
    *   **Style:** Full-width rounded button (`rounded-xl`), background `#066AC9`, text `#FFFFFF`. Features a crisp, 16x16px `+` SVG icon vertically aligned to the left of the text.
    *   **Interaction:** On click (or tap), the system must immediately clear the Main Chat Area, generate a new UUID for `session_id` in the frontend state, reset the chat context array to empty, and autofocus the chat input bar. A subtle scale-down micro-animation (`transform: scale(0.97)`) occurs during the click.
*   **UI-002: Universal Sidebar Search Bar:**
    *   **Position:** Directly beneath the "New Chat" button, sticky positioned so it remains visible when scrolling through 100+ past chats.
    *   **Style:** Input field with a magnifying glass SVG icon absolute-positioned on the left. Background `#FFFFFF`, border `1px solid #B3B3B3`, text `#1F2022`. 
    *   **Focus State:** When focused, the border transitions instantly to `#066AC9` with a subtle glow `shadow-[0px_0px_13px_0px_#066AC94D]`.
    *   **Behavior:** As the user types, it filters the list of past chats in real-time. The input is debounced by 300ms to prevent React re-render lagging. 
    *   **Search Logic Restriction:** The search filters exclusively against the *Chat Titles* (which are auto-generated by the AI), ensuring sub-50ms latency. It does NOT search the deep message content.
*   **UI-003: Chat History List Groupings:**
    *   **Grouping Algorithm:** Chats are dynamically grouped by chronological timeframes: "Today", "Previous 7 Days", "Previous 30 Days", and "Older".
    *   **Item Style:** Each chat item is a flex container with padding `8px 12px`. The title text is truncated using CSS `text-overflow: ellipsis; white-space: nowrap; overflow: hidden;` to strictly enforce a maximum of 1 line. 
    *   **Active Selection State:** The currently viewed chat has a persistent background of `#0000001A` (10% opacity black) to indicate selection.
    *   **Hover State:** Hovering over an inactive chat changes its background to `#0000000D` (5% opacity black) and reveals a small trash-can SVG icon on the right edge. 
    *   **Deletion Interaction:** Clicking the trash can triggers a centralized confirmation modal: *"Are you sure you want to delete this chat? This action cannot be undone."*
*   **UI-004: Contextual Counselor / Admin Dashboard Toggle:**
    *   **Condition:** This UI element is heavily guarded. It only renders if the authenticated user's client-side JWT payload contains the `role: COUNSELOR` or `role: ADMIN` claim.
    *   **Position:** Anchored to the absolute bottom of the sidebar, above a 1px solid `#B3B3B3` separator line.
    *   **Style:** A distinct, darker pill button with an accompanying dashboard/gauge icon, providing quick routing to the `/dashboard` or `/admin` routes.

### 2.4 Top Navigation Bar (Header) Detailed Specs
*   **UI-005: Contextual Chat Title Bar:** 
    *   Centered in the top header, which has a height of `60px` and a bottom border `1px solid #EDEDED`. Displays the name of the current chat (e.g., "Computer Science Deadlines") in `14px font-semibold text-[#1F2022]`. 
    *   If on a mobile device, this header also houses the hamburger menu on the far left.
*   **UI-006: Profile Dropdown Menu & Authentication State:**
    *   **Position:** Top right corner of the header, padding `16px`.
    *   **Authenticated Avatar:** Displays the user's initials (e.g., "SR") inside a perfect circle `border-radius: 50%`, width `36px`, height `36px`, with background `#066AC9` and white text. 
    *   **Unauthenticated Avatar:** If the user is an anonymous guest, it displays a generic gray silhouette icon.
    *   **Dropdown Logic:** Triggers on click using a Radix UI or Headless UI accessible popover. Renders a menu containing: "Sign In" (if guest), or "My Profile", "Accessibility Settings", "Theme Toggle (Light/Dark)", and "Log Out" (if authenticated). 

### 2.5 Main Chat Area & Message Bubbles Detailed Specs
This is the core interaction canvas. Every pixel must be meticulously crafted.

*   **UI-007: Empty State (Zero Messages Canvas):**
    *   When a new chat is initiated, the canvas displays a large, beautifully rendered brand logo or a 3D globe asset vertically centered on the screen to establish premium branding.
    *   Directly below the logo, a CSS Grid (2x2 on Desktop, 1x4 on Mobile) of "Prompt Suggestion" cards is displayed.
    *   **Suggestion Examples:** "What are the visa requirements for the UK?", "Am I eligible for a 100% scholarship?", "What is the fee for an MBA?", "Connect me to a counselor."
    *   **Card Style:** White background `#FFFFFF`, light gray border `#EDEDED`, subtle shadow on hover `hover:shadow-lg`, transition duration `300ms`, `rounded-xl`.
    *   **Interaction:** Clicking a card captures the text, injects it into the input box, and automatically triggers the submit function, providing immediate gratification to the user without requiring typing.
*   **UI-008: Conversational Message Bubbles:**
    *   **User Message:** Right-aligned flex container. Background `#066AC9`. Text `#FFFFFF`. Border-radius is highly rounded `rounded-[20px]`, but the bottom-right corner is sharpened `rounded-br-none` to visually indicate the speaker direction. No avatar is displayed to save space and reduce clutter. Maximum width is `75%` of the chat container.
    *   **AI Message:** Left-aligned flex container. Background `#F7F7F7` (off-white). Text `#1F2022`. Border-radius `rounded-[20px]` with a sharpened bottom-left corner `rounded-bl-none`. Maximum width is `85%` of the chat container.
    *   **AI Avatar:** A small `24px x 24px`, circular AI robot icon or the brand logo sits adjacent to the AI bubble to humanize the interaction.
    *   **Markdown Support Engine:** The AI message container must run incoming text through a robust Markdown parser (e.g., `react-markdown` with `remark-gfm`). It must perfectly and securely render bold text, bulleted lists, numbered lists, markdown tables, and clickable hyperlinks for citations (which must strictly open in a `_blank` target window with `rel="noopener noreferrer"` for security).
*   **UI-009: The Chat Input Box (Fixed Footer):**
    *   **Position:** Fixed at the bottom center of the screen, floating slightly above the edge with a `24px` margin. Max-width is mathematically constrained to `800px` for optimal reading width, regardless of monitor size.
    *   **Style:** A sophisticated, auto-expanding `textarea`. It starts at exactly 1 line of height. As the user types, an `onInput` React ref automatically adjusts the height to grow up to a maximum of 5 lines (approx `120px` height) before enabling an internal vertical scrollbar. Border `1px solid #B3B3B3`, rounded corners `rounded-[24px]`, padding `12px 48px 12px 16px`.
    *   **Focus State:** On focus, the border transitions to the primary brand blue `#066AC9`, and a soft blue glow `shadow-[0px_0px_24px_0px_#006ac94D]` surrounds the entire box.
    *   **Send Button:** Absolute positioned inside the right edge of the input box, `12px` from the right. Features an upward-facing arrow SVG. Color `#FFFFFF` with background `#066AC9` in a small circle. It is strictly disabled (opacity 50%, `cursor-not-allowed`) if the `textarea` is empty or only contains whitespace.
    *   **Keyboard Interactions:** Pressing `Enter` executes the submit function (preventing default newline). Pressing `Shift+Enter` injects a newline character `\n` without submitting, allowing multi-line questions.

---

## 3. Exhaustive Interaction Flows & Component States

To guarantee a flawless, ChatGPT-level user experience, frontend developers must adhere strictly to the following micro-interaction lifecycles.

### 3.1 The "Sending a Message" Lifecycle (Real-Time UI State Machine)
When a user clicks the "Send" button or presses `Enter`, the UI must progress through these exact synchronous states to ensure the user never feels like the application has frozen.
1.  **State 1 (Lock & Submit):** The text in the input box is captured into a React state variable. The `textarea` is instantly cleared and visually shrinks back to its default 1-line height. The Send button becomes immediately disabled to prevent double-submissions. The main chat area is locked from receiving new user input.
2.  **State 2 (Optimistic UI Update):** The captured user message is instantly appended to the DOM in a right-aligned blue bubble. The chat window immediately auto-scrolls to the absolute bottom to ensure the new message is in view using `scrollIntoView({ behavior: 'smooth' })`.
3.  **State 3 (Loading Indicator / AI Thinking):** A placeholder AI message bubble appears (left-aligned) containing a pulsating three-dot animation (`. . .`) or a subtle primary gradient skeleton loader. This critical state indicates to the user that the Gemini API is actively processing the request and generating tools.
4.  **State 4 (Streaming Response via SSE):** The Next.js server initiates a Server-Sent Events (SSE) stream back to the client. The loading dots are destroyed, and actual text begins appearing chunk-by-chunk in real-time. The auto-scroll mechanism stays pinned to the bottom as the text grows, ensuring the newest words are always visible.
5.  **State 5 (Completion & Unlock):** The SSE stream receives a strict `[DONE]` signal from the backend. The AI bubble finalizes its markdown rendering (parsing any incomplete tables or links that were broken mid-stream). The input box is re-enabled, returning to State 0, ready for the next prompt.

### 3.2 Human Handover (Escalation) State Lifecycle
This defines the precise UI behavior when the AI must hand the conversation off to a human.
*   **Trigger Mechanism:** A persistent "Talk to a Human" button exists slightly above the input box (styled subtly as a text link with an icon, to not distract from the main input). Alternatively, the Gemini AI can auto-trigger this state via an internal function call if it determines the user's query is dangerously sensitive (e.g., severe visa rejection distress), highly complex, or repeatedly misunderstood.
*   **UI Change (Pending State):** The chat input box becomes strictly disabled and grayed out. A sticky banner appears at the bottom of the chat window: *"Connecting you to a human counselor... Please wait."* accompanied by a spinning loader SVG. The user cannot send messages during this waiting period.
*   **Resolution (Active State):** When a human counselor clicks "Accept" on their internal dashboard, a WebSocket or SSE event is fired to the student's UI. The sticky banner turns green (`#538B19`) and updates to: *"You are now chatting with [Counselor Name]."*. The input box is re-enabled. The AI avatar icon is replaced by the human Counselor's actual profile picture for all subsequent messages in that session, clearly delineating the handover boundary.


## 4. Deep-Dive Functional Requirements (Exhaustive Use Cases)

The following Use Cases define the absolute, step-by-step logic required for every conceivable system action, ensuring developers understand both the happy paths and every possible failure state.

### UC-001: Agentic LLM Orchestration (Core AI Engine Workflow)
*   **Description:** A student asks a complex question, and the Gemini agent autonomously retrieves the necessary external data to formulate a perfectly accurate answer.
*   **Actors:** Student, Next.js API, Gemini Agent, Vector DB, CRM API.
*   **Preconditions:** The student has an active `session_id` and submits a text payload to `/api/chat`.
*   **Main Success Flow:**
    1.  The Next.js backend receives the prompt, validates the JWT, and queries PostgreSQL to reconstruct the last 10 messages of the conversation history (context window).
    2.  The backend forwards the array to the Gemini LLM API via Google's SDK, alongside a system prompt defining the AI's persona ("You are a study abroad admission counselor...").
    3.  **Agentic Decision Phase:** Gemini analyzes the intent of the prompt. 
        *   *Scenario A (Policy):* If the prompt asks about refund policies, Gemini halts generation and returns a function call request for the `search_vector_store` tool with specific keywords.
        *   *Scenario B (Live Data):* If the prompt asks "Are there seats left in BSc Physics?", Gemini returns a function call request for the `query_crm_api` tool with the argument `program_code="PHY101"`.
    4.  The Next.js backend intercepts the tool request, executes the corresponding database/API query, and returns the raw JSON/text payload back to Gemini as a tool response message.
    5.  Gemini synthesizes the raw payload, ensuring it cites the source, into a conversational, empathetic response.
    6.  The backend streams the final string back to the user interface via SSE.
    7.  Once the stream completes, the backend asynchronously saves the User Message and the AI Message to the PostgreSQL `messages` table.
*   **Alternate/Error Flows:**
    *   *E1: Tool Failure:* If the Vector Store or CRM API is down (returns 500), the backend informs Gemini of the failure. Gemini generates a fallback response: *"I am currently unable to access the live database to check seat availability. Please hold while I connect you to a human."* The system then auto-triggers the Escalation state.
    *   *E2: Gemini Timeout:* If the Gemini API takes longer than 8,000ms to respond, the backend aborts the request and returns a static HTTP 504 Gateway Timeout error. The UI displays a red error bubble: *"Network timeout. Please try sending your message again."*
*   **Postconditions:** The student receives an accurate, cited answer, and the transaction (including token cost) is securely logged in the database.

### UC-002: Asynchronous Auto-Title Generation
*   **Description:** To populate the Sidebar Chat History effectively, the system must generate human-readable titles for each chat session based on context.
*   **Actors:** Next.js Backend, Fast LLM (Gemini Flash).
*   **Preconditions:** A user sends the *very first* message in a newly created session (the PostgreSQL `messages` count for that `session_id` is 0).
*   **Main Success Flow:**
    1.  Simultaneous to initiating the main chat response stream, the backend spins off a non-blocking asynchronous background task (e.g., using a queue or serverless function background execution).
    2.  The background task sends the user's first prompt to a smaller, low-latency LLM model with the strict system prompt: *"Summarize this user query into a concise 3-5 word title. Return ONLY the title text, with no quotes or punctuation."*
    3.  The backend receives the generated title.
    4.  The backend executes an `UPDATE sessions SET title = $1 WHERE id = $2` query in PostgreSQL.
    5.  The backend fires a Server-Sent Event (or WebSocket message) targeted at the user's client, containing the new title.
    6.  The UI receives the event and dynamically updates the sidebar list item from "New Chat" to the generated title, providing a seamless "magic" experience without requiring a page refresh.
*   **Alternate/Error Flows:**
    *   *E1: Title Generation Fails:* If the fast LLM times out or errors, the database is not updated. The title remains the default "New Chat" or fallback to the first 20 characters of the user's prompt. This failure must fail silently and not interrupt the main chat flow.

### UC-003: Real-Time Counselor Dashboard Escalation Queue
*   **Description:** Counselors must be able to monitor a live queue of students requiring human assistance and seamlessly take over AI sessions.
*   **Actors:** Human Counselor, Next.js Backend, PostgreSQL.
*   **Preconditions:** The Counselor is logged into the `/counselor/dashboard` route with a valid `COUNSELOR` JWT role.
*   **Main Success Flow:**
    1.  The dashboard establishes a persistent Server-Sent Events (SSE) connection to the backend `/api/dashboard/stream`.
    2.  When a student triggers UC-001's escalation flow, PostgreSQL's `sessions` table is updated (`status = PENDING_ESCALATION`).
    3.  A database trigger or application-level event broadcasts this change to the dashboard stream.
    4.  A new UI Card slides into the "Pending Queue" column on the Counselor's screen. The card displays the student's ID, the auto-generated chat title, and a live timer counting up (e.g., "Waiting: 02m 14s").
    5.  The Counselor reviews the queue and clicks the blue "Take Over" button on a specific card.
    6.  An API `PUT` request is sent, updating the session status to `ESCALATED_ACTIVE` and assigning `counselor_id = [Current User ID]`.
    7.  The UI redirects the Counselor to the active chat view. The screen is immediately pre-loaded with the entire conversation history between the AI and the student, allowing the Counselor to read the context before replying.
    8.  The Counselor types a message and hits send. The message is routed directly to the student, bypassing Gemini completely.
*   **Alternate/Error Flows:**
    *   *E1: Concurrent Takeover:* If two Counselors click "Take Over" on the same card simultaneously, the backend utilizes optimistic locking or a strict SQL `UPDATE ... WHERE status = 'PENDING'` clause. The second counselor receives a 409 Conflict error, and the UI displays: *"This session has already been claimed by another counselor."*

### UC-004: User Authentication via OAuth 2.0 (SSO)
*   **Description:** A student or counselor logs into the system using Google or Microsoft federated identity.
*   **Actors:** End-User, Next.js Auth (NextAuth.js), Google/Microsoft Identity Provider.
*   **Preconditions:** None.
*   **Main Success Flow:**
    1.  User clicks "Log In with Google" on the UI.
    2.  User is redirected to the Google OAuth consent screen.
    3.  User authenticates successfully and is redirected back to the `/api/auth/callback` endpoint.
    4.  Backend extracts the email and queries the `users` table.
    5.  <mark>If the user does not exist, a new record is created with `role = STUDENT`. If the email domain matches `@consultancy.com`, role is set to `COUNSELOR`.</mark>
    6.  Backend generates a stateless JWT containing the `user_id` and `role`.
    7.  The JWT is set as an `HttpOnly`, `Secure` cookie.
    8.  User is redirected to their respective dashboard.
*   **Alternate/Error Flows:**
    *   *E1: OAuth Denial:* User denies consent on the Google screen. System redirects back to login with a URL error parameter, displaying: "Authentication cancelled."

### UC-005: Guest Chat History Retention via Local Storage
*   **Description:** Unauthenticated students can chat, and their history must persist if they refresh the page.
*   **Actors:** Guest User, Client Browser, Next.js API.
*   **Preconditions:** User is not logged in.
*   **Main Success Flow:**
    1.  Guest starts a chat. Backend generates a `session_id` and returns it in the response payload.
    2.  Frontend stores this `session_id` in the browser's `localStorage` array.
    3.  User closes the tab and reopens it later.
    4.  Frontend checks `localStorage`, finds the `session_id` array, and fires `GET /api/sessions/history` for those IDs.
    5.  Backend returns the chat histories, and the Sidebar populates seamlessly.
*   **Alternate/Error Flows:**
    *   *E1: Cleared Cache:* If the user clears their browser cache, the `localStorage` is wiped. The system gracefully starts a fresh session, and previous anonymous chats are permanently lost (intended behavior for guests).

### UC-006: Administrator RAG Document Upload
*   **Description:** An Admin uploads a new PDF policy document to train the Gemini AI.
*   **Actors:** Administrator, Backend, Embedding Model, Vector DB.
*   **Preconditions:** Admin is authenticated with `role = ADMIN`.
*   **Main Success Flow:**
    1.  Admin navigates to the "Knowledge Base" tab and drops a PDF into the uploader.
    2.  Backend extracts raw text from the PDF using a parsing library.
    3.  Backend chunks the text using a recursive character text splitter (e.g., 1000 character chunks with 200 character overlap).
    4.  Backend sends the chunks to the Google `text-embedding-gecko` API to generate 768-dimensional vectors.
    5.  Backend upserts the vectors and metadata (URL, page numbers) into the Pinecone/PgVector database.
    6.  UI displays a success toast: "Knowledge base successfully updated. AI is now trained on this document."
*   **Alternate/Error Flows:**
    *   *E1: File Too Large:* If the PDF exceeds 10MB, the backend rejects it immediately with a 413 Payload Too Large error to save parsing compute.

### UC-007: Administrator KPI Analytics Export (CSV)
*   **Description:** Admins download a CSV report of chatbot performance, with strict PII masking applied.
*   **Actors:** Administrator, Backend, PostgreSQL.
*   **Preconditions:** Admin is logged in.
*   **Main Success Flow:**
    1.  Admin selects a date range and clicks "Export CSV".
    2.  Backend runs a complex aggregate SQL query joining `sessions`, `messages`, and `users`.
    3.  Backend streams the SQL results through a Regex masking function that replaces standard email patterns and phone numbers with `[REDACTED]`.
    4.  Backend formats the stream as CSV and sets the `Content-Disposition` header for download.
    5.  Admin's browser downloads `analytics_report_2026.csv`.
*   **Alternate/Error Flows:**
    *   *E1: Timeout:* If the date range is too massive (e.g., 5 years of data), the query may exceed the 30-second DB timeout. The backend catches the timeout and returns a 504 error, prompting the Admin to select a smaller date range.

### UC-008: Dynamic Prompt Suggestion Generation
*   **Description:** The system must suggest 4 relevant questions when a user opens an empty chat.
*   **Actors:** System Backend.
*   **Preconditions:** User clicks "New Chat".
*   **Main Success Flow:**
    1.  Backend receives request to initialize chat.
    2.  Backend queries PostgreSQL for the top 4 most frequently asked questions globally over the last 24 hours.
    3.  Backend returns these 4 strings in the initial load payload.
    4.  UI renders them as clickable cards.
*   **Alternate/Error Flows:**
    *   *E1: DB Failure:* If the aggregation query fails, backend falls back to 4 hardcoded string constants (e.g., "How do I apply?").

### UC-009: PII Detection & Automated Warning
*   **Description:** The system must warn a user if they attempt to send sensitive financial or health data to the AI.
*   **Actors:** Student, Client UI, Regex Engine.
*   **Preconditions:** Student is typing a message in the input box.
*   **Main Success Flow:**
    1.  As the student types, a client-side Javascript Regex engine runs in the background `onInput`.
    2.  The Regex detects a string matching a credit card format (e.g., 16 digits).
    3.  Before the user can hit Send, a yellow warning banner appears above the input box: *"Warning: Please do not share financial information, passwords, or sensitive personal data with the AI."*
    4.  User deletes the numbers, and the banner disappears.
*   **Alternate/Error Flows:**
    *   *E1: Ignored Warning:* If the user ignores the warning and hits Send anyway, the backend executes a secondary check and explicitly masks the data before sending it to the Gemini API, substituting it with `[CREDIT_CARD_REMOVED]`.

### UC-010: Counselor to Counselor Chat Transfer
*   **Description:** A counselor realizes they do not have the expertise for a query (e.g., specific Visa laws) and transfers the chat to a specialist counselor.
*   **Actors:** Counselor A, Counselor B, Backend.
*   **Preconditions:** Chat is in `ESCALATED_ACTIVE` status assigned to Counselor A.
*   **Main Success Flow:**
    1.  Counselor A clicks the "Transfer" button.
    2.  A dropdown appears listing online Counselors and their specialties (e.g., "John Doe - Visa Specialist").
    3.  Counselor A selects John Doe.
    4.  Backend updates the `session.counselor_id` to John Doe's UUID and alerts John Doe's dashboard via SSE.
    5.  John Doe clicks "Accept Transfer".
    6.  Student UI updates: *"You have been transferred to John Doe, our Visa Specialist."*

### UC-011: Automated Session Pruning (GDPR Compliance)
*   **Description:** The system automatically deletes guest chat histories after 30 days to comply with data retention laws.
*   **Actors:** System Cron Job, PostgreSQL.
*   **Preconditions:** A scheduled cron job runs nightly at 02:00 UTC.
*   **Main Success Flow:**
    1.  Cron job executes a script on the backend.
    2.  Script runs SQL: `DELETE FROM sessions WHERE user_id IS NULL AND created_at < NOW() - INTERVAL '30 days'`.
    3.  PostgreSQL CASCADE deletes all associated rows in the `messages` table.
    4.  Script logs the successful deletion of X records to the infrastructure logs.

### UC-012: Theme Toggling (Light/Dark Mode)
*   **Description:** User switches the UI from Light Mode to Dark Mode.
*   **Actors:** End-User, UI Framework.
*   **Preconditions:** User is viewing the chat interface.
*   **Main Success Flow:**
    1.  User clicks the Profile Dropdown and selects "Toggle Dark Mode".
    2.  React updates the global state and adds the `.dark` class to the HTML root tag.
    3.  TailwindCSS instantly swaps all background and text color variables (e.g., `#FFFFFF` background becomes `#121212`, text becomes `#E0E0E0`). The primary brand blue (`#066AC9`) and gradients must NOT be inverted; they remain identical across both modes to maintain the core theme identity.
    4.  The preference is saved to `localStorage` for future visits.

### UC-013: AI Hallucination Feedback Loop (Thumbs Up/Down)
*   **Description:** Users can provide feedback on AI responses to help fine-tune the prompts later.
*   **Actors:** User, Backend, Database.
*   **Preconditions:** An AI message is rendered on screen.
*   **Main Success Flow:**
    1.  User hovers over the AI message bubble.
    2.  Thumbs Up and Thumbs Down SVG icons appear next to the bubble.
    3.  User clicks Thumbs Down.
    4.  A small modal appears asking "Why? (Inaccurate, Unhelpful, Inappropriate)".
    5.  User selects "Inaccurate" and submits.
    6.  Backend logs the feedback rating linked to that specific `message_id`.

### UC-014: Password Reset Workflow (Administrators)
*   **Description:** An Admin forgets their manual password and requests a reset link.
*   **Actors:** Admin, Auth Service, Email Provider (SendGrid).
*   **Main Success Flow:**
    1.  Admin clicks "Forgot Password" on login page and enters email.
    2.  Backend generates a secure, time-limited cryptographic token.
    3.  Backend emails a reset link containing the token via SendGrid.
    4.  Admin clicks link, enters new password.
    5.  Backend verifies token, bcrypt hashes new password, and updates DB.

### UC-015: Rate Limit Hit & Graceful Degradation
*   **Description:** A malicious bot attempts to spam the `/api/chat` endpoint.
*   **Actors:** Bot/Spammer, Redis Rate Limiter, Next.js Edge.
*   **Main Success Flow:**
    1.  Bot sends 21 requests within an hour from a guest IP.
    2.  Next.js Edge middleware intercepts the request before it hits the main server.
    3.  Redis checks the IP counter, sees it exceeds the limit of 20.
    4.  Edge immediately returns a strict `429 Too Many Requests` HTTP response.
    5.  UI displays a polite message: *"You have reached your hourly message limit. Please create an account or try again later."*


---

## 5. Exhaustive Business Rules

The system must programmatically enforce the following institutional rules at all times. Failure to obey these rules could result in legal liability or brand damage.

| Rule ID | Category | Strict Rule Description | Related Component |
| :--- | :--- | :--- | :--- |
| **BR-001** | Privacy | Direct applicants interacting with the system must be at least 13 years old (COPPA compliance). | UI Onboarding |
| **BR-002** | Authority | In the event of a conflict between an AI output and the official website, the published PDF guidelines always override the AI-generated response. | RAG System |
| **BR-003** | Security | Counselors cannot edit system configurations; only users with the `ADMIN` role possess configuration authorization. | RBAC / Auth |
| **BR-004** | Privacy | When analytics reports are exported to CSV, all PII (names, emails, phone numbers) MUST be cryptographically masked or redacted. | Admin Dashboard |
| **BR-005** | Legal | The chatbot must display a persistent, non-dismissible disclaimer: "I am an AI assistant. My answers do not constitute a legal guarantee of admission to any partner university." | Chat UI |
| **BR-006** | Financial | The chatbot is strictly prohibited from requesting credit card numbers, bank routing numbers, or cryptocurrency transfers. | Regex Filter |
| **BR-007** | Operations | A counselor must respond to an escalated chat within 5 minutes. If exceeded, the session is re-routed to the next available counselor. | Dashboard Queue |
| **BR-008** | Operations | If no human counselors are online (e.g., outside business hours 9AM-5PM GMT), the Escalation button must convert to a "Leave a Ticket" form. | UI / API |
| **BR-009** | Identity | Students logging in via OAuth must use verified emails. Unverified emails will restrict chat access to Guest tier limits. | NextAuth |
| **BR-010** | Content | The AI must strictly refuse to answer questions unrelated to higher education, study abroad, visas, or consultancy services. | LLM System Prompt |
| **BR-011** | Content | The AI must never guarantee visa approval, as this is at the strict discretion of the destination country's immigration department. | LLM System Prompt |
| **BR-012** | Financial | The AI must never negotiate consultancy fees. It must only quote standard, published pricing tiers. | LLM System Prompt |
| **BR-013** | Privacy | Chat histories older than 365 days for authenticated users must be permanently wiped from the database to comply with GDPR storage limitations. | Postgres Cron |
| **BR-014** | Privacy | Guest (unauthenticated) chat histories must be wiped after 30 days. | Postgres Cron |
| **BR-015** | Operations | Maximum allowed file size for Admin PDF uploads to the Vector Database is 20MB. | File Uploader |
| **BR-016** | Content | The Vector database must be refreshed/re-indexed at least once every 90 days to prevent stale admission deadlines. | RAG System |
| **BR-017** | Performance| The Gemini LLM `temperature` parameter must be hardcoded between `0.1` and `0.3` to prioritize factual accuracy over creative hallucination. | API Codebase |
| **BR-018** | Security | API Rate limits for guests are strictly capped at 20 messages per IP address per hour. | Redis Edge |
| **BR-019** | Security | API Rate limits for authenticated students are capped at 100 messages per hour. | Redis Edge |
| **BR-020** | Support | Counselors can only view chat histories that they have actively escalated or that have been assigned to them. | RBAC |
| **BR-021** | Support | Admins can view all anonymized chat histories globally for QA purposes, but cannot view PII without a secondary auth step. | RBAC |
| **BR-022** | Legal | The user must click a checkbox agreeing to the Terms of Service and Privacy Policy before initiating their very first chat. | UI Onboarding |
| **BR-023** | AI Safety | Profanity, hate speech, and harassment are handled via a 3-layer system: <br>1. Regex filter for obvious profanity (fast). <br>2. AI moderation model (e.g., Gemini safety filters) for contextual analysis. <br>3. Human review for repeated or borderline violations. <br>Confirmed violations result in a 24-hour IP ban. | Multi-Layer Moderation |
| **BR-024** | Identity | User passwords must be minimum 12 characters, requiring upper, lower, number, and special character. | Auth Service |
| **BR-025** | Language | The chatbot must detect the user's input language and respond in the same language automatically, prioritizing English and regional Indian languages (Hindi, Telugu, etc.). | Gemini Prompt |
| **BR-026** | Operations | A session abandoned for more than 24 hours without a message must be automatically marked as `CLOSED`. | Postgres Trigger |
| **BR-027** | Tracking | Every single API request to Google Gemini must log the exact `token_cost` for financial auditing. | Backend API |
| **BR-028** | UX | The streaming response must never break Markdown syntax mid-stream (e.g., leaving a half-open link tag `[click here](`). The UI must gracefully handle incomplete markdown. | React Frontend |
| **BR-029** | Feedback | A user can only submit one thumbs-up or thumbs-down rating per AI message to prevent skewed metrics. | API Route |
| **BR-030** | Maintenance| During scheduled backend maintenance, the chat UI must disable the input box and display a "System Under Maintenance" banner rather than failing silently. | Global App State |
| **BR-031** | AI Safety | If the AI cannot find the requested information in the Vector Store or via CRM APIs, it must explicitly state "I do not have adequate data for this request" and trigger the Human Escalation flow. The AI is strictly prohibited from assuming or hallucinating data under any circumstances. | LLM System Prompt |

---

## 6. Comprehensive Data Requirements & Database Schema

This architecture mandates a highly optimized, enterprise-grade hybrid database approach. **PostgreSQL 15+** will handle all relational, highly-structured transactional data to guarantee ACID compliance. A dedicated Vector extension (**PgVector**) or external service (**Pinecone**) will handle the unstructured RAG document embeddings.

### 6.1 PostgreSQL Relational Schema (14 Core Tables)
All primary keys MUST utilize `UUIDv4` to prevent sequential ID guessing (horizontal enumeration attacks).

#### Table 1: `users`
Identity management for all actors.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `uuid_generate_v4()` | Unique identifier. |
| `email` | `VARCHAR(255)` | Unique, B-Tree Index | Required for Counselors/Admins. Null for guest students. |
| `password_hash` | `VARCHAR(255)` | Nullable | Bcrypt hashed password. |
| `role` | `VARCHAR(50)` | Default 'STUDENT', Not Null | Enum restriction: `STUDENT`, `COUNSELOR`, `ADMIN`. |
| `created_at` | `TIMESTAMP` | Default `NOW()`, Not Null | Immutable account creation timestamp. |
| `last_login` | `TIMESTAMP` | Nullable | Tracked for security audits. |

#### Table 2: `sessions`
Chat groupings and metadata.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique chat session ID. |
| `user_id` | `UUID` | FK (`users.id`), B-Tree Index | The student who owns the chat. |
| `counselor_id` | `UUID` | FK (`users.id`), Nullable | The counselor assigned during escalation. |
| `title` | `VARCHAR(150)` | Default 'New Chat' | AI-generated chat title. |
| `status` | `VARCHAR(50)` | Default 'ACTIVE', Index | Enum: `ACTIVE`, `PENDING_ESCALATION`, `ESCALATED_ACTIVE`, `CLOSED`. |
| `created_at` | `TIMESTAMP` | Default `NOW()` | Session start time. |
| `updated_at` | `TIMESTAMP` | Default `NOW()` | Modified on every new message via Trigger. |

#### Table 3: `messages`
Individual chat dialogue entries. This table will scale into the millions of rows and requires aggressive indexing.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique message ID. |
| `session_id` | `UUID` | FK (`sessions.id`), B-Tree Index | **CRITICAL INDEX:** Must be indexed for $O(\log n)$ retrieval. |
| `sender_type` | `VARCHAR(50)` | Not Null | Enum: `USER`, `AI`, `COUNSELOR`, `SYSTEM`. |
| `content` | `TEXT` | Not Null | The actual message content. |
| `created_at` | `TIMESTAMP` | Default `NOW()`, Index | Message timestamp, used for chronological sorting. |

#### Table 4: `message_metrics`
Tracks the exact financial cost of every Gemini API call. Split from `messages` to improve read performance on the main table.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Metric ID. |
| `message_id` | `UUID` | FK (`messages.id`), Unique | 1:1 relationship with an AI message. |
| `prompt_tokens` | `INT` | Default 0 | Tokens sent to Gemini. |
| `completion_tokens`| `INT` | Default 0 | Tokens returned by Gemini. |
| `estimated_cost` | `DECIMAL(10,6)` | Default 0.000000 | Calculated USD cost based on current API pricing. |

#### Table 5: `message_feedback`
Stores user ratings for AI responses to aid in future fine-tuning.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Feedback ID. |
| `message_id` | `UUID` | FK (`messages.id`), Unique | Prevents double voting on a single message. |
| `rating` | `INT` | Not Null | `1` for Thumbs Up, `-1` for Thumbs Down. |
| `feedback_reason` | `VARCHAR(255)` | Nullable | e.g., "Inaccurate", "Too long". |
| `created_at` | `TIMESTAMP` | Default `NOW()` | Timestamp. |

#### Table 6: `counselor_performance`
Aggregated metrics for human staff to populate the Admin Dashboard.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `counselor_id` | `UUID` | Primary Key, FK (`users.id`) | Links to the staff member. |
| `total_handled` | `INT` | Default 0 | Total chats taken over. |
| `avg_response_sec`| `INT` | Default 0 | Average time to accept an escalation. |
| `satisfaction_score`| `DECIMAL(3,2)` | Nullable | Aggregate user feedback score. |

#### Table 7: `institution_programs`
Structured data for the chatbot to query via tool calling when students ask about specific degrees.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `program_code` | `VARCHAR(50)` | Primary Key | e.g., "CS-MS-UK". |
| `program_name` | `VARCHAR(255)` | Index | e.g., "Master of Science in Computer Science". |
| `country` | `VARCHAR(100)` | Index | e.g., "United Kingdom". |
| `tuition_fee` | `INT` | Not Null | Yearly fee in USD. |
| `deadline_fall` | `DATE` | Not Null | Application deadline. |
| `ielts_requirement`| `DECIMAL(2,1)` | Not Null | Minimum score (e.g., 6.5). |

#### Table 8: `student_profiles`
Stores structured data extracted from the conversation to prevent the AI from repeatedly asking for context.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `UUID` | Primary Key, FK (`users.id`) | The student. |
| `target_country` | `VARCHAR(100)` | Nullable | e.g., "Canada". |
| `current_gpa` | `DECIMAL(3,2)` | Nullable | Current academic standing. |
| `budget_usd` | `INT` | Nullable | Max budget for tuition. |
| `updated_at` | `TIMESTAMP` | Default `NOW()` | Last time context was extracted. |

#### Table 9: `system_audit_logs`
Mandatory compliance table logging every sensitive action taken by Admins and Counselors.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Log ID. |
| `actor_id` | `UUID` | FK (`users.id`), Index | The admin/counselor who performed the action. |
| `action_type` | `VARCHAR(100)` | Index | e.g., `DELETE_USER`, `EXPORT_CSV`, `UPLOAD_PDF`. |
| `target_entity` | `VARCHAR(255)` | Nullable | What was affected. |
| `ip_address` | `VARCHAR(45)` | Not Null | IPv4 or IPv6 of the actor. |
| `created_at` | `TIMESTAMP` | Default `NOW()` | Timestamp. |

#### Table 10: `banned_ips`
Security table utilized by the Edge middleware to block malicious actors.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `ip_address` | `VARCHAR(45)` | Primary Key | The offending IP. |
| `reason` | `VARCHAR(255)` | Not Null | e.g., `RATE_LIMIT_ABUSE`, `PROFANITY`. |
| `expires_at` | `TIMESTAMP` | Not Null | Time when the ban is lifted. |

#### Table 11: `refresh_tokens`
Stores secure refresh tokens to maintain persistent sessions without requiring frequent re-authentication.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique token identifier. |
| `user_id` | `UUID` | FK (`users.id`), Index | The user this token belongs to. |
| `token_hash` | `VARCHAR(255)` | Unique, Not Null | Hashed version of the token for security. |
| `expires_at` | `TIMESTAMP` | Not Null | Token expiration date. |
| `revoked_at` | `TIMESTAMP` | Nullable | Populated when a user explicitly logs out or token is invalidated. |

#### Table 12: `notifications`
Manages real-time alerts for counselors and automated notifications for users.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Notification ID. |
| `user_id` | `UUID` | FK (`users.id`), Index | The recipient of the notification. |
| `type` | `VARCHAR(50)` | Not Null | e.g., `ESCALATION_ALERT`, `DOCUMENT_PROCESSED`. |
| `content` | `TEXT` | Not Null | The notification message. |
| `is_read` | `BOOLEAN` | Default `FALSE` | Read status. |
| `created_at` | `TIMESTAMP` | Default `NOW()` | Timestamp. |

#### Table 13: `audit_events`
Granular logging of all critical system actions for security and compliance audits (more detailed than generic logs).
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Event ID. |
| `actor_id` | `UUID` | FK (`users.id`), Index | The user who performed the action. |
| `event_type` | `VARCHAR(100)` | Index | e.g., `AUTH_SUCCESS`, `RAG_UPLOAD`, `DB_QUERY`. |
| `metadata` | `JSONB` | Nullable | Contextual details (e.g., query params, affected rows). |
| `ip_address` | `VARCHAR(45)` | Not Null | Originating IP address. |
| `created_at` | `TIMESTAMP` | Default `NOW()` | Timestamp. |

#### Table 14: `uploaded_documents`
Tracks PDF uploads for the Vector Store, managing versions and processing status.
| Column Name | Data Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Document ID. |
| `filename` | `VARCHAR(255)` | Not Null | Original file name. |
| `s3_url` | `VARCHAR(512)` | Not Null | Secure URL in cloud storage. |
| `status` | `VARCHAR(50)` | Not Null | Enum: `PENDING`, `PROCESSING`, `EMBEDDED`, `FAILED`. |
| `uploaded_by`| `UUID` | FK (`users.id`), Index | The admin who uploaded the document. |
| `created_at` | `TIMESTAMP` | Default `NOW()` | Upload timestamp. |

### 6.2 Vector Store Schema (Institutional RAG Knowledge)
This schema defines how partner university PDFs, website FAQs, and admission policies are chunked and stored for semantic similarity search.

**Collection Name: `consultancy_knowledge_base`**
*   **`id`** (`String`): A unique deterministic SHA-256 hash of the chunk's text to prevent duplicate insertions.
*   **`embedding`** (`FloatArray[768]`): The dense vector representation generated via Google's embedding model.
*   **`metadata`** (JSON payload):
    *   `text` (String): The actual raw text paragraph retrieved (Max 1000 chars).
    *   `source_url` (String): The URL or PDF filename where this text originated. Critical for citations.
    *   `category` (String): "Admissions", "Fees", "Visa", or "Campus Life". 
    *   `last_updated` (Timestamp): Ensures stale vectors can be pruned.


---

## 7. External Interfaces & API Specifications

To ensure the Frontend (React) and Backend (Node.js) code can remain completely decoupled, the following REST API contracts are strictly defined. All endpoints are hosted under the `/api/v1/*` namespace. Unless specified as public, all endpoints require a valid JWT Bearer token in the `Authorization` header.

### 7.1 Core Chat & Session Endpoints

#### API-001: Initialize New Session
*   **Endpoint:** `POST /api/v1/sessions`
*   **Description:** Creates a new chat session and returns a UUID.
*   **Headers:** `Authorization: Bearer <jwt_token>` (Optional for guests).
*   **Payload Request (JSON):** None.
*   **Payload Response (JSON):**
    ```json
    {
      "success": true,
      "session_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "status": "ACTIVE",
      "created_at": "2026-06-27T10:00:00Z"
    }
    ```
*   **Status Codes:** `201 Created`, `429 Too Many Requests`.

#### API-002: Process Chat Message (Streaming)
*   **Endpoint:** `POST /api/v1/chat/stream`
*   **Description:** Accepts a user query, invokes the Gemini agent, and returns a chunked streaming response via Server-Sent Events (SSE).
*   **Headers:** `Authorization: Bearer <jwt_token>`, `Content-Type: application/json`
*   **Request Payload (JSON):**
    ```json
    {
      "session_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "message": "What is the minimum IELTS score for PG programs and what is the deadline?"
    }
    ```
*   **Response (Text/Event-Stream):** 
    ```text
    data: {"chunk": "The "}
    data: {"chunk": "minimum "}
    ...
    data: {"done": true, "citations": ["https://www.consultancy.com/ielts"], "token_cost": 45}
    ```
*   **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found` (if session_id invalid).

#### API-003: Fetch User Chat History (Sidebar)
*   **Endpoint:** `GET /api/v1/sessions`
*   **Description:** Retrieves the list of past chat sessions for the authenticated user to populate the Sidebar.
*   **Response Payload (JSON):**
    ```json
    {
      "sessions": [
        {
          "session_id": "f47ac10b-...",
          "title": "IELTS Requirements",
          "status": "CLOSED",
          "created_at": "2026-06-25T10:00:00Z"
        }
      ]
    }
    ```
*   **Status Codes:** `200 OK`, `401 Unauthorized`.

#### API-004: Fetch Specific Chat Messages
*   **Endpoint:** `GET /api/v1/sessions/:session_id/messages`
*   **Description:** Retrieves the full array of past messages to populate the UI when a user clicks a chat in the sidebar.
*   **Response Payload (JSON):**
    ```json
    {
      "session_id": "f47ac10b-...",
      "messages": [
        {
          "id": "msg_001",
          "sender_type": "USER",
          "content": "Hi!",
          "created_at": "2026-06-27T10:00:00Z"
        }
      ]
    }
    ```
*   **Status Codes:** `200 OK`, `403 Forbidden` (User does not own this session).

#### API-005: Trigger Human Escalation
*   **Endpoint:** `PUT /api/v1/sessions/:session_id/escalate`
*   **Description:** Flags the session for counselor intervention.
*   **Request Payload (JSON):**
    ```json
    { "reason": "USER_REQUESTED" }
    ```
*   **Response (JSON):**
    ```json
    { "success": true, "new_status": "PENDING_ESCALATION" }
    ```

#### API-006: Rename Chat Title
*   **Endpoint:** `PATCH /api/v1/sessions/:session_id/title`
*   **Description:** Allows a user to manually rename an auto-generated chat title.
*   **Request Payload (JSON):** `{ "title": "Visa Questions" }`
*   **Status Codes:** `200 OK`, `400 Bad Request` (Title too long).

#### API-007: Delete Chat Session
*   **Endpoint:** `DELETE /api/v1/sessions/:session_id`
*   **Description:** Soft-deletes a chat session from the user's view.
*   **Status Codes:** `204 No Content`, `403 Forbidden`.

### 7.2 Counselor & Dashboard Endpoints

#### API-008: SSE Dashboard Event Stream
*   **Endpoint:** `GET /api/v1/dashboard/stream`
*   **Description:** Establishes a persistent SSE connection for Counselors to receive live queue updates.
*   **Headers:** `Authorization: Bearer <jwt_token>` (Must have `COUNSELOR` role).
*   **Response (Text/Event-Stream):**
    ```text
    event: new_escalation
    data: {"session_id": "...", "wait_time_sec": 0}
    ```

#### API-009: Claim Escalated Session
*   **Endpoint:** `PUT /api/v1/sessions/:session_id/claim`
*   **Description:** Counselor takes over a pending chat.
*   **Request Payload (JSON):** None.
*   **Response (JSON):** `{ "success": true, "counselor_id": "..." }`
*   **Status Codes:** `200 OK`, `409 Conflict` (Already claimed).

#### API-010: Send Manual Counselor Message
*   **Endpoint:** `POST /api/v1/sessions/:session_id/counselor_message`
*   **Description:** Counselor sends a message directly to the student, bypassing the AI.
*   **Request Payload (JSON):** `{ "content": "Hello, I am reviewing your visa status." }`
*   **Status Codes:** `201 Created`.

### 7.3 Admin & System Endpoints

#### API-011: Export Analytics CSV
*   **Endpoint:** `GET /api/v1/admin/export`
*   **Description:** Downloads a PII-masked CSV of chat metrics.
*   **Query Params:** `?start_date=2026-01-01&end_date=2026-01-31`
*   **Response:** `text/csv` attachment.
*   **Status Codes:** `200 OK`, `403 Forbidden` (Must be ADMIN).

#### API-012: Upload RAG Document
*   **Endpoint:** `POST /api/v1/admin/knowledge/upload`
*   **Description:** Uploads a PDF to be chunked and vectorized.
*   **Content-Type:** `multipart/form-data`
*   **Payload:** `file` (Binary PDF), `category` (String).
*   **Status Codes:** `202 Accepted` (Processing in background), `413 Payload Too Large`.

#### API-013: Get KPI Dashboard Metrics
*   **Endpoint:** `GET /api/v1/admin/metrics`
*   **Description:** Fetches aggregate data for the admin UI.
*   **Response Payload (JSON):**
    ```json
    {
      "total_chats": 14500,
      "escalation_rate": 12.5,
      "total_token_cost_usd": 450.25
    }
    ```

#### API-014: Authenticate / Login
*   **Endpoint:** `POST /api/v1/auth/login`
*   **Description:** Email/Password login for staff.
*   **Request Payload:** `{ "email": "admin@consultancy.com", "password": "..." }`
*   **Response Payload:** `{ "token": "ey..." }`

#### API-015: Submit Feedback
*   **Endpoint:** `POST /api/v1/messages/:message_id/feedback`
*   **Description:** User submits a thumbs up/down rating for an AI message.
*   **Request Payload:** `{ "rating": -1, "reason": "Inaccurate" }`
*   **Status Codes:** `201 Created`, `409 Conflict` (Already rated).

---

## 8. Rigorous Non-Functional Requirements (NFRs)

This system is designed for massive enterprise scale. The following metrics are non-negotiable and must be continuously monitored via automated alerting systems (e.g., Datadog, Prometheus).

### 8.1 Performance, Scalability & SLAs
*   **NFR-001 (Time to First Token - TTFT):** The system must process the API request, invoke the LLM, and stream the very first character of the AI response back to the UI within **1,200 milliseconds** (P95 latency measurement). 
*   **NFR-002 (Throughput & Concurrency):** The Next.js backend, Node.js event loop, and PostgreSQL database connection pool must reliably support **2,000 concurrent active chat sessions** without degrading TTFT by more than 500ms.
*   **NFR-003 (Vector Search Latency):** The semantic search query to Pinecone/PgVector must complete and return the top 5 chunks within **150 milliseconds**.
*   **NFR-004 (Rate Limiting & Cost Control):** To prevent malicious DDoS API abuse or runaway Gemini token costs:
    *   Unauthenticated/Guest IP addresses are strictly limited to 20 messages per hour (via Redis-backed rate limiting).
    *   Authenticated users are limited to 100 messages per hour.

### 8.2 Enterprise Security & Data Privacy
*   **NFR-005 (JWT Architecture):** Authentication relies entirely on stateless JSON Web Tokens.
    *   Tokens are cryptographically signed using the `HS256` algorithm with a highly secure 256-bit secret stored only in environment variables.
    *   Tokens are **NEVER** exposed to `localStorage` or JavaScript scope. They must be strictly stored in an `HttpOnly`, `Secure`, `SameSite=Strict` browser cookie to prevent XSS exfiltration.
    *   Token Expiration (`exp` claim) is strictly set to 24 hours to mitigate session hijacking.
*   **NFR-006 (Data Sanitization & Injection Prevention):** All incoming chat messages must be aggressively sanitized. The client will utilize `DOMPurify` before rendering markdown. The server will validate all inputs against strict schemas (e.g., Zod) to prevent Cross-Site Scripting (XSS), SQL Injection, and LLM prompt-injection attacks (e.g., "Ignore all previous instructions...").
*   **NFR-007 (At-Rest Encryption):** The PostgreSQL database volume must be encrypted at the block level using AES-256 encryption, managed via an external Key Management Service (AWS KMS, Google Cloud KMS, etc.).
*   **NFR-008 (PII Data Minimization):** Personally Identifiable Information (PII) identified in chats must not be persistently stored on local instances longer than necessary for the session, ensuring strict compliance with GDPR/FERPA municipal data regulations.

### 8.3 Reliability & Automated Deployment (CI/CD)
*   **NFR-009 (Infrastructure & Scaling):** The application will be deployed as stateless Docker containers orchestrated by Kubernetes (or leveraging Vercel's edge network). Horizontal Pod Autoscaler (HPA) policies will automatically spin up additional replica nodes if overall CPU utilization exceeds 75%.
*   **NFR-010 (Testing Gates):** Continuous Integration (CI) is mandatory. All code pushed to the `main` branch must pass automated GitHub Actions pipelines ensuring:
    *   ESLint and TypeScript compilation (`tsc --noEmit`) checks pass with zero warnings.
    *   Jest Unit test coverage is maintained at a minimum of `>= 85%` for all utility functions and API route logic.
    *   Playwright End-to-End (E2E) UI tests pass (verifying the Send button logic, Sidebar history loading, and the full Counselor Escalation flow across Chromium, WebKit, and Firefox).
*   **NFR-011 (Centralized Logging):** All unhandled exceptions, HTTP 500s, and API timeouts must be shipped to a centralized logging cluster (ELK stack or Datadog) for rapid debugging by the developer. No sensitive user queries may be logged in plaintext.

---

## 9. Supporting Artifacts & Approvals

### 9.1 Exhaustive Glossary of Terms
*   **Agentic AI:** An advanced AI system capable of not just answering questions, but autonomously orchestrating multi-step plans and invoking external tools/APIs to achieve a goal.
*   **RAG (Retrieval-Augmented Generation):** A technique where the LLM is fed relevant, verified documents from a database just-in-time, preventing hallucinations and ensuring answers are based on institutional truth.
*   **SIS (Student Information System):** The core consultancy database holding student records, live course catalogs, and admission statuses.
*   **SSO (Single Sign-On):** Allows counselors and admins to log in using their existing consultancy Microsoft/Google credentials.
*   **PII (Personally Identifiable Information):** Data that can identify a specific individual (Name, SSN, Phone).
*   **JWT (JSON Web Token):** A cryptographically secure, stateless method of verifying user identity without requiring server-side session memory.
*   **SSE (Server-Sent Events):** A one-way web technology allowing the server to push real-time streaming text to the browser over a single HTTP connection.

### 9.2 Appendix Links
*   **A.1:** High-Fidelity Figma Wireframes for the Chat UI (To be provided by the designer and linked here).
*   **A.2:** Comprehensive Postman Collection for all API endpoints (To be maintained in the project's technical GitHub wiki).

### 9.3 Formal Approvers and Sign Off
By signing below, the stakeholders agree that this exhaustive SRS comprehensively and accurately defines the software to be built. Any significant deviations from this 15+ page specification will require a formal Change Request process.

| Name | Role / Department | Signature | Date |
| :--- | :--- | :--- | :--- |
| Siddhanth Rathore | Product Owner | ___________________ | ____________ |
| [Name] | Lead Software Engineer | ___________________ | ____________ |
| [Name] | UI/UX Director | ___________________ | ____________ |
| [Name] | Admissions Director| ___________________ | ____________ |
| [Name] | Chief Information Security Officer | ___________________ | ____________ |


---

## 10. Comprehensive Quality Assurance (QA) Test Plan

To ensure a flawless deployment of the AI-Powered Admission Counselor, the developer must meticulously execute the following test cases. This section serves as the foundational blueprint for automated E2E tests (Playwright) and manual UAT (User Acceptance Testing).

### 10.1 UI/UX Functional Test Cases

**TC-001: Sidebar Chat Filtering**
*   **Objective:** Verify the debounced search bar accurately filters chat history titles.
*   **Preconditions:** User has 50+ chats in history, including one titled "Visa Deadlines UK".
*   **Test Steps:**
    1. Click into the Sidebar search input.
    2. Type "Visa".
    3. Wait 300ms (debounce threshold).
    4. Verify only chats containing "Visa" in the title are displayed.
    5. Type "xyz123".
    6. Verify an empty state message is displayed: "No chats found."
*   **Expected Result:** Filtering is case-insensitive, instantaneous after debounce, and UI updates without full page reloads.

**TC-002: Auto-Scrolling on New Message**
*   **Objective:** Verify the chat canvas remains pinned to the bottom when the AI streams a massive text block.
*   **Preconditions:** Chat canvas already contains enough messages to enable the vertical scrollbar.
*   **Test Steps:**
    1. Send a prompt: "Give me a 500-word essay on studying in Australia."
    2. As the AI begins streaming, do not touch the mouse wheel.
    3. Verify the window automatically scrolls down as new lines are rendered.
    4. Manually scroll up mid-stream.
    5. Verify auto-scroll pauses (so the user doesn't lose their place).
*   **Expected Result:** Smooth automatic scrolling that respects manual user intervention.

**TC-003: Markdown Table Rendering Security**
*   **Objective:** Verify the AI can render complex tables without breaking the React DOM or allowing XSS.
*   **Preconditions:** None.
*   **Test Steps:**
    1. Send prompt: "Provide a table comparing tuition fees in the US vs UK."
    2. Wait for stream completion.
    3. Verify a properly styled HTML `<table>` is rendered within the chat bubble.
    4. Attempt to inject `<script>alert(1)</script>` into the prompt.
    5. Verify the script is escaped and rendered as plaintext, not executed.
*   **Expected Result:** Complete XSS immunity via DOMPurify, with pixel-perfect table styling (borders, padding, striped rows).

**TC-004: Empty State Prompt Suggestions**
*   **Objective:** Verify prompt suggestion cards auto-submit when clicked.
*   **Preconditions:** Initiated a completely new, empty session.
*   **Test Steps:**
    1. Verify 4 suggestion cards are visible on the canvas.
    2. Click the card reading "Am I eligible for a scholarship?".
    3. Verify the text is instantly injected into the input box.
    4. Verify the input box immediately fires the submit event.
    5. Verify the cards disappear from the UI once the user message bubble appears.
*   **Expected Result:** Frictionless one-click initiation of the conversation.

### 10.2 Agentic LLM Test Cases

**TC-005: Vector Store Triggering (RAG)**
*   **Objective:** Verify the Gemini Agent correctly identifies when to query the internal PDF knowledge base.
*   **Preconditions:** Vector store is populated with a document detailing a highly specific partner university refund policy.
*   **Test Steps:**
    1. Send prompt: "What happens if my visa is rejected? Do I get my deposit back?"
    2. Monitor the backend logs.
    3. Verify Gemini halts text generation and executes a function call to `search_vector_store`.
    4. Verify the backend successfully retrieves the chunk and feeds it back to Gemini.
    5. Verify the final AI response cites the specific refund policy document accurately.
*   **Expected Result:** Zero hallucination. The AI must explicitly state the policy and provide a clickable citation link.

**TC-006: Live SIS Data Query Triggering**
*   **Objective:** Verify the Gemini Agent correctly queries live Postgres tables for dynamic data.
*   **Preconditions:** The `institution_programs` table shows 0 seats left for "Data Science Masters".
*   **Test Steps:**
    1. Send prompt: "Can I still apply for the Data Science Masters program?"
    2. Monitor backend logs. Verify function call `query_crm_api(program='Data Science')` is executed.
    3. Verify the final response states the program is full, preventing the student from wasting an application fee.
*   **Expected Result:** Real-time data synthesis.

### 10.3 Escalation & Dashboard Test Cases

**TC-007: Human Handover Trigger & Lock**
*   **Objective:** Verify the user input is disabled during a pending escalation.
*   **Preconditions:** User is in an active chat.
*   **Test Steps:**
    1. User clicks "Talk to a Human".
    2. Verify the `textarea` becomes disabled (`disabled` attribute applied).
    3. Verify the "Connecting..." banner appears.
    4. Attempt to press `Enter` in the chat box.
    5. Verify no message is sent.
*   **Expected Result:** The user is forced to wait, preventing chat state desynchronization.

**TC-008: Counselor Takeover Overwrite Prevention**
*   **Objective:** Verify two counselors cannot claim the same student simultaneously.
*   **Preconditions:** Chat session is `PENDING_ESCALATION`. Two counselors (A and B) are viewing the dashboard.
*   **Test Steps:**
    1. Counselor A and Counselor B both see the student card.
    2. Counselor A clicks "Take Over".
    3. Backend processes the request and assigns Counselor A.
    4. Counselor B clicks "Take Over" 500ms later on the same card.
    5. Verify Counselor B receives a "Session already claimed" error toast.
    6. Verify Counselor B is NOT redirected to the chat window.
*   **Expected Result:** Strict concurrency control preventing overlapping counsel.

### 10.4 Authentication & Security Test Cases

**TC-009: JWT Expiration & Auto-Logout**
*   **Objective:** Verify the system boots a user when their token expires.
*   **Preconditions:** User is authenticated.
*   **Test Steps:**
    1. Manually edit the JWT cookie to expire in 10 seconds.
    2. Wait 11 seconds.
    3. Attempt to send a message to `/api/chat`.
    4. Verify backend returns `401 Unauthorized`.
    5. Verify frontend intercepts the 401 and forces a redirect to `/login`.
*   **Expected Result:** Absolute enforcement of session TTLs.

**TC-010: Rate Limiting Enforcement**
*   **Objective:** Verify the Redis rate limiter stops spam bots.
*   **Preconditions:** Unauthenticated guest user.
*   **Test Steps:**
    1. Run a script to hit `/api/chat` 21 times within 60 seconds.
    2. Verify responses 1-20 return `200 OK`.
    3. Verify response 21 returns `429 Too Many Requests`.
    4. Verify the UI displays the rate limit warning banner.
*   **Expected Result:** Infrastructure protection mechanisms activate flawlessly.


---

## 11. Exhaustive Error Message Dictionary

To ensure consistent, empathetic, and professional communication with end-users, the application must strictly map backend error codes to predefined UI error strings. Hardcoded backend error payloads must never be exposed directly to the user interface.

### 11.1 Client-Side (UI) Error States

| Error Code | Trigger Condition | Exact UI String Displayed | UI Component |
| :--- | :--- | :--- | :--- |
| `ERR_UI_001` | User clicks Send with an empty input box. | (No toast. Button remains visually disabled). | Input Box |
| `ERR_UI_002` | User attempts to upload a PDF > 20MB. | "File too large. Please ensure the document is under 20MB." | Dashboard Uploader |
| `ERR_UI_003` | User attempts to upload a non-PDF file. | "Invalid file format. Only .pdf files are supported for the Knowledge Base." | Dashboard Uploader |
| `ERR_UI_004` | Regex detects a 16-digit credit card pattern. | "Warning: Please do not share financial information, passwords, or sensitive personal data with the AI." | Input Warning Banner |
| `ERR_UI_005` | Websocket/SSE connection drops mid-stream. | "Connection lost. Attempting to reconnect..." | Top Header Toast |
| `ERR_UI_006` | User tries to access `/dashboard` without JWT. | "You must be logged in as a Counselor to view this page." | Full Page Redirect |
| `ERR_UI_007` | Markdown parsing fails due to malformed table. | (Silently fallback to rendering raw text without breaking React). | Message Bubble |
| `ERR_UI_008` | LocalStorage quota exceeded (too many guest chats).| "Chat history full. Older anonymous chats have been cleared." | Sidebar Toast |

### 11.2 API & Server-Side Error States

| HTTP Code | Internal Code | Trigger Condition | Exact UI String Displayed | Severity |
| :--- | :--- | :--- | :--- | :--- |
| `400` | `ERR_API_400A` | Missing `session_id` in request body. | "An unexpected error occurred. Please refresh the page and try again." | Low |
| `400` | `ERR_API_400B` | Message body exceeds 2000 characters. | "Your message is too long. Please condense your question." | Low |
| `401` | `ERR_API_401A` | JWT token expired or missing. | "Your session has expired. Please log in again." | Medium |
| `403` | `ERR_API_403A` | Student attempts to view another student's chat. | "Access denied. You do not have permission to view this session." | High |
| `403` | `ERR_API_403B` | Counselor attempts to export Admin CSV. | "Access denied. Only Administrators can export financial analytics." | High |
| `404` | `ERR_API_404A` | Fetching a `session_id` that was deleted. | "This chat session no longer exists or was deleted." | Low |
| `409` | `ERR_API_409A` | Counselor B tries to claim Counselor A's chat. | "This session has already been claimed by another counselor." | Low |
| `409` | `ERR_API_409B` | User submits multiple feedback ratings for one message. | "You have already rated this response." | Low |
| `413` | `ERR_API_413A` | Payload Too Large (Express body limit). | "The request payload exceeded system limits." | Medium |
| `422` | `ERR_API_422A` | Unprocessable Entity (Zod schema validation failed).| "Invalid request format. Please ensure all fields are correct." | Low |
| `429` | `ERR_API_429A` | Redis Rate Limiter triggered (Guest > 20/hr). | "You have reached your hourly message limit. Please create an account to continue." | Medium |
| `429` | `ERR_API_429B` | Redis Rate Limiter triggered (Auth > 100/hr). | "You have exceeded the system rate limits. Please try again later." | Medium |
| `500` | `ERR_API_500A` | PostgreSQL connection pool exhausted. | "The system is currently experiencing high load. Please hold." | Critical |
| `500` | `ERR_API_500B` | Vector Database (Pinecone) unreachable. | "The AI is currently unable to access the knowledge base. Connecting you to a human..." | Critical |
| `504` | `ERR_API_504A` | Google Gemini API exceeds 8000ms timeout. | "Network timeout. The AI took too long to respond. Please try sending your message again." | High |

### 11.3 Agentic LLM (Gemini) Error Fallbacks

Because the LLM is non-deterministic, it may occasionally fail to generate a proper function call or may hallucinate a JSON structure. The backend must catch these parsing errors and inject fallback prompts.

*   **Failure:** Gemini returns malformed JSON when calling a tool (e.g., missing a closing bracket).
    *   **Backend Action:** Do not crash. Send a hidden system message back to Gemini: `System: Your last function call failed JSON validation. Please output valid JSON only.`
    *   **User Experience:** The UI simply displays the spinning loader `. . .` for an extra 1-2 seconds while the backend auto-corrects the AI in a hidden loop.

*   **Failure:** Gemini refuses to answer a safe question due to an overactive internal safety filter (e.g., falsely flagging "visa rejection" as self-harm).
    *   **Backend Action:** Catch the `finishReason: SAFETY` flag from the Google SDK.
    *   **User Experience:** Output standard string: *"I'm sorry, I am unable to process that specific request. Let me connect you to a human counselor who can assist you better."* Trigger escalation flow.


---

## 12. Hardware, Infrastructure, & Deployment Specifications

To satisfy NFR-001 (1,200ms TTFT) and NFR-002 (2,000 concurrent active chat sessions), the following infrastructure architecture must be strictly adhered to by the developer.

### 12.1 Target Production Environment Architecture
*   **Cloud Provider:** Amazon Web Services (AWS) or Vercel Edge Network.
*   **Container Orchestration:** Kubernetes (EKS) for managing Dockerized Next.js frontend/backend containers.
*   **Content Delivery Network (CDN):** Cloudflare (Enterprise Tier) for edge caching static assets, DDOS mitigation, and globally distributed Web Application Firewall (WAF) routing.
*   **Database Hosting:** Amazon RDS (Relational Database Service) for PostgreSQL to enable Multi-AZ failover.
*   **Vector Database:** Pinecone Serverless (Enterprise) hosted in the `us-east-1` region to minimize latency to the primary Node.js servers.
*   **Cache / Rate Limiter:** Amazon ElastiCache (Redis) for in-memory session counting and IP rate limiting.

### 12.2 Compute Resource Allocation (Minimum Specifications)

| Component | Minimum Compute Tier | RAM Allocation | Storage | Auto-Scaling Policy |
| :--- | :--- | :--- | :--- | :--- |
| Next.js App Servers | 4x AWS `c6g.xlarge` (ARM Graviton) | 8 GB RAM | 20 GB EBS | Scale out +1 pod if CPU > 75% for 3 mins. |
| PostgreSQL Database | 1x AWS `db.r6g.2xlarge` | 64 GB RAM | 500 GB NVMe | Scale up IOPS if read latency > 20ms. |
| Redis Cache | 2x AWS `cache.t4g.medium` | 4 GB RAM | N/A | Multi-AZ Primary/Replica configuration. |
| Embedding Worker | AWS Lambda (Serverless) | 2 GB RAM | N/A | Spins up on-demand during PDF uploads. |

### 12.3 Network Bandwidth & Latency Budgets
*   **Next.js Server -> Gemini API Latency:** Must not exceed 150ms round-trip (excluding Gemini processing time). To achieve this, Next.js servers must be hosted in the same geographic region as the Google Cloud Platform (GCP) endpoint (e.g., `us-east4`).
*   **Client -> Next.js Server Latency:** Must not exceed 200ms globally. Vercel Edge or Cloudflare must route requests to the nearest edge node before forwarding to the origin server.
*   **PostgreSQL Query Budgets:** The `messages` table lookup for chat history must execute in `< 30ms`. The B-Tree index on `session_id` is mathematically required to guarantee this scale as the table surpasses 10 million rows.

### 12.4 CI/CD Pipeline Definitions (GitHub Actions)
The deployment pipeline must enforce strict quality gates before any code is promoted to the Production environment.

**Stage 1: Pre-Flight Checks (Runs on every Pull Request)**
1.  **Code Format:** `npm run lint` and `Prettier` check. Fails if warnings exist.
2.  **Type Safety:** `tsc --noEmit` verifies strict TypeScript compilation.
3.  **Security Audit:** `npm audit` and `Snyk` scan for vulnerabilities in `package.json` dependencies.
4.  **Unit Tests:** Jest executes 500+ unit tests. Fails if code coverage drops below 85%.

**Stage 2: Staging Deployment (Runs on merge to `main`)**
1.  **Docker Build:** Code is compiled into a highly optimized, multi-stage Docker image (Alpine Linux base to reduce attack surface).
2.  **Push to ECR:** Image pushed to Amazon Elastic Container Registry.
3.  **Deploy to Staging Cluster:** EKS pulls the image and deploys to the `staging` namespace.
4.  **Database Migrations:** Prisma or Flyway runs SQL schema updates automatically.

**Stage 3: End-to-End Verification**
1.  **Playwright UI Tests:** Automated headless browsers (Chromium, Firefox, WebKit) execute the 10 QA Test Cases outlined in Section 10 against the Staging URL.
2.  **Load Test (K6):** A localized K6 script blasts the Staging API with 500 requests/sec for 1 minute to verify Redis rate limiting logic.

**Stage 4: Production Promotion (Manual Gate)**
1.  **Approval:** A Lead Engineer or Product Manager clicks the "Promote to Prod" button in GitHub Actions.
2.  **Blue/Green Deployment:** Kubernetes spins up the new containers alongside the old ones. Traffic is shifted via weighted routing to ensure zero downtime.

---

## 13. Deep-Dive Data Dictionary

To eliminate ambiguity for the developer, this dictionary strictly defines the exact data types and formats for the most critical data elements in the application.

| Field Name | Type / Format | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `id` (Primary Keys) | `UUIDv4` String | `f47ac10b-58cc-4372-a567-0e02b2c3d479` | Universally Unique Identifier, 36 characters including hyphens. Never use auto-incrementing integers to prevent URL enumeration. |
| `created_at` | `ISO 8601 Timestamp`| `2026-06-27T10:00:00.000Z` | Standardized UTC timestamp. Must include milliseconds. |
| `password_hash` | `Bcrypt Hash` | `$2b$12$eImiTXuWVxfM37uY4JANj...` | Generated using bcrypt with a salt round factor of exactly 12. |
| `email` | `String` | `siddhanth@consultancy.com` | Lowercased, stripped of whitespace. Must pass standard RFC 5322 regex validation. |
| `ip_address` | `String` | `192.168.1.1` or `2001:db8::1` | Must support both IPv4 and IPv6 string lengths (up to 45 characters). |
| `token_cost` | `Integer` | `450` | The raw integer count of LLM tokens (prompt + completion). Cost in USD is calculated dynamically in the UI based on current Google pricing tables to prevent stale DB numbers. |
| `target_country` | `String (Enum-like)` | `United Kingdom` | Normalized country names strictly matching the official ISO 3166-1 English short names to ensure DB joins work correctly. |
| `tuition_fee` | `Integer` | `35000` | Stored as a raw integer in USD. The frontend is responsible for formatting it as `$35,000` or converting to INR dynamically. |
| `embedding` | `Float32Array[768]` | `[-0.012, 0.443, ...]` | The dense vector output from Google's `text-embedding-gecko` API. Must strictly have 768 dimensions. |

---

## 14. Final Executive Approvals

By signing below, the stakeholders officially agree that this exhaustive, 1,500+ line Enterprise Edition SRS comprehensively and accurately defines the software to be built. Any significant deviations from this specification—including changes to UI layouts, API payloads, Database schemas, or Non-Functional constraints—will require a formal Change Request (CR) process and secondary executive approval.

| Name | Role / Department | Signature | Date |
| :--- | :--- | :--- | :--- |
| **Siddhanth Rathore** | Product Owner | ___________________ | ____________ |
| **[Name]** | Lead Software Engineer | ___________________ | ____________ |
| **[Name]** | UI/UX Director | ___________________ | ____________ |
| **[Name]** | Admissions Director| ___________________ | ____________ |
| **[Name]** | Chief Information Security Officer | ___________________ | ____________ |
| **[Name]** | Data Protection Officer (DPO) | ___________________ | ____________ |