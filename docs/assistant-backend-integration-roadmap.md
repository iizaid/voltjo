# VoltJo AI Assistant Backend Integration Roadmap

This document outlines the technical design, architectural plan, and step-by-step implementation phases for connecting the **VoltJo AI Assistant** frontend to a production-grade, secure, and streaming AI backend.

---

## 1. Current Frontend State
* **Dedicated Chat UI:** An interactive and fully styled Arabic-first chat shell exists at `/assistant` (routed through `app/assistant/page.tsx` rendering `<ChatShell />`).
* **Local State Only:** Currently, the chat relies on a client-side state machine in `components/chat/ChatShell.tsx`, which triggers a simulated network delay and retrieves static mock responses from `lib/chat/mock-chat.ts`.
* **Zero Backend Connectivity:** No dynamic network requests or remote API routes are configured yet. 
* **State Persistence Transition:** Before full database integration, messages and conversation listings should first be backed by `localStorage` on the client side to provide instant user retention without database costs.

---

## 2. Target Architecture

```mermaid
graph TD
    Client[Client Browser /assistant] -->|HTTPS POST + Stream| API[Next.js API Route: /api/chat]
    API -->|Load Config & Env| Env[Environment Variables]
    API -->|System Prompt| Prompt[System Prompt Engine]
    API -->|Provider Factory| Abstraction[Provider Abstraction Layer]
    Abstraction -->|Stream Helper| Client
    Abstraction -->|Provider: Mock| MockService[Mock Provider]
    Abstraction -->|Provider: OpenAI| OpenAI[OpenAI API / Azure OpenAI]
    OpenAI -->|Optional RAG / KB| VectorDB[(Vector DB / Vehicle Specs)]
    API -->|Optional Analytics/Audit| DB[(Database / Auth Server)]
```

The future target architecture splits responsibilities cleanly to protect API credentials and optimize performance:
1. **Frontend Chat UI:** Captures user queries, renders markdown/lists in RTL format, holds local storage fallback, and handles readable chunk-by-chunk stream decoding.
2. **Next.js Route Handler (`app/api/chat/route.ts`):** A server-side endpoint acting as a secure proxy. It guards API keys, applies rate limiting, resolves context, and returns a Server-Sent Events (SSE) stream.
3. **Provider Abstraction Layer:** A unified interface allowing hot-swapping between model providers (e.g., OpenAI, Anthropic, or local open-source models) without modifying the API route logic.
4. **Streaming Response Support:** Uses standard HTTP transfer-encoding chunking to minimize Time-to-First-Byte (TTFB) and make the assistant feel active and responsive.
5. **Database Persistence (Optional/Future):** Long-term cloud storage for threads, feedback logs, and detailed auditing.
6. **Authentication (Optional/Future):** Integration with a session store or NextAuth to sync chats across devices.

---

## 3. Proposed Files for Backend Integration

To maintain modularity, the following files should be created or updated during implementation:

* **`app/api/chat/route.ts`** [NEW]
  * The Next.js POST endpoint that parses the query, applies system instructions, validates inputs, and triggers the AI stream.
* **`lib/ai/types.ts`** [NEW]
  * Core TypeScript interfaces defining chat completions, model providers, custom system roles, and raw API interfaces.
* **`lib/ai/providers/openai.ts`** [NEW]
  * The provider driver wrapper wrapping the official `@ai-sdk/openai` or `openai` client.
* **`lib/ai/providers/mock.ts`** [NEW]
  * A server-side mock provider returning incremental streaming mock responses for offline local development and testing.
* **`lib/ai/system-prompt.ts`** [NEW]
  * Stores version-controlled system-level constraints and specific Jordanian EV/hybrid knowledge context.
* **`lib/ai/stream.ts`** [NEW]
  * Utility helper functions to transform API streams into standard browser-compatible readable streams.
* **`lib/chat/types.ts`** [MODIFY]
  * Align the frontend message structures with dynamic streaming chunks, error boundaries, and source citation markers.
* **`lib/chat/storage.ts`** [MODIFY]
  * Add client-side logic to persist conversations in `localStorage` and retrieve past sessions on mounting.

---

## 4. Environment Variables

The server will require the following configurations in a secure `.env.local` file. **Never expose these parameters to the client side.**

```bash
# ==============================================================================
# VoltJo AI Assistant Configuration
# ==============================================================================

# Determines which AI client to initialize (e.g., 'openai', 'mock')
AI_PROVIDER=openai

# Specified AI model target (e.g., 'gpt-4o', 'gpt-4o-mini')
AI_MODEL=gpt-4o-mini

# Secure private key for OpenAI access (kept strictly server-side)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Remote PostgreSQL/MongoDB URI for thread database persistence
# DATABASE_URL=postgresql://db_user:password@localhost:5432/voltjo
```

---

## 5. API Request Shape

The client will invoke `POST /api/chat` with a JSON payload of the following structure:

```json
{
  "conversationId": "chat_session_83f98c22d",
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "شو هي تكلفة شحن سيارة BYD Song Plus بالبيت في الأردن؟"
    }
  ],
  "sourcesActive": true,
  "vehicleContext": {
    "brand": "BYD",
    "model": "Song Plus DM-i",
    "batteryCapacityKwh": 18.3
  },
  "locale": "ar-JO"
}
```

### Parameters:
* `conversationId` (string, required): Used to associate messages in logs or optional server databases.
* `messages` (array, required): The conversation history containing `role` (`user`, `assistant`, `system`) and `content` fields.
* `sourcesActive` (boolean, optional): Requests the backend to append local citations and knowledge base links.
* `vehicleContext` (object, optional): Provides specific vehicle parameters if the user is asking from a dedicated vehicle page.
* `locale` (string, optional): Forces specific local dialect rendering and region constraints (defaults to `ar-JO`).

---

## 6. API Response Shape

The API must support two consumption modalities: standard static JSON (Phase 2) and real-time chunked streaming (Phase 3).

### Standard JSON Response (Non-Streaming)
Used for simple diagnostic endpoints or slow-client fallbacks:
```json
{
  "id": "chat_resp_92b8d91c",
  "role": "assistant",
  "content": "تكلفة الشحن المنزلي لسيارة BYD Song Plus تعتمد على الفئة والتعرفة الكهربائية الحالية.",
  "bullets": [
    "شحن البطارية بالكامل (18.3 كيلوواط/ساعة) يكلف حوالي 0.60 دينار أردني خارج الذروة.",
    "وقت الذروة يرتفع السعر إلى حوالي 1.15 دينار أردني.",
    "يرجى التحقق من تطابق تعرفة عدادك المنزلي مع شرائح شركة الكهرباء."
  ],
  "sources": [
    {
      "title": "تعرفة الكهرباء المنزلية في الأردن - 2026",
      "url": "/resources/jordan-electricity-tariffs"
    }
  ],
  "createdAt": "2026-05-26T11:00:00Z"
}
```

### Streaming Response Plan (SSE)
Using `Server-Sent Events` (`text/event-stream`), the backend broadcasts discrete JSON fragments to the client as they are generated. 

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Transfer-Encoding: chunked
```

**Stream Data Chunks:**
```text
data: {"type": "chunk", "delta": "ت"}
data: {"type": "chunk", "delta": "ك"}
data: {"type": "chunk", "delta": "لفة "}
data: {"type": "bullet_start", "index": 0}
data: {"type": "bullet_chunk", "delta": "الشحن خارج الذروة تقريبي جداً"}
data: {"type": "source", "source": {"title": "دليل الشحن", "url": "/resources"}}
data: {"type": "done"}
```

---

## 7. System Prompt Direction

The prompt engineering must enforce an **Arabic-first, localized, and context-bound personality**. Below is a recommended structural draft for the `lib/ai/system-prompt.ts` system prompt.

```markdown
أنت "VoltJo Assistant" - المساعد الذكي والمستشار التقني الأول المتخصص في السيارات الكهربائية والهايبرد في المملكة الأردنية الهاشمية.

هدفنا هو تبسيط قرار الانتقال للطاقة النظيفة وتمكين المستخدم من الفهم الدقيق قبل الشراء.

### القواعد والإرشادات الأساسية للرد:
1. **الهوية المحلية:** 
   - لغتك الأساسية هي العربية الفصحى المبسطة، المطعمّة ببعض المصطلحات الدارجة في الأردن الخاصة بالسيارات والشحن (مثل "عداد منزلي"، "تعرفة مدعومة"، "محطة عامة"، "ترخيص"، "حرة الزرقاء").
   - جميع العملات تُعرض بالدينار الأردني (د.أ) أو القروش.
   - عند حساب التكلفة، اعتمد دوماً على شرائح تعرفة الكهرباء المعمول بها رسمياً في الأردن (التعرفة المدعومة وغير المدعومة، وفترات الذروة وخارج الذروة).

2. **التخصص والدقة التقنية:**
   - أنت خبير بالسيارات الكهربائية والهايبرد المنتشرة في السوق الأردني (مثل طرازات BYD, Volkswagen ID series, Tesla, Hyundai/Kia, Toyota Hybrid).
   - ناقش بصراحة مواصفات البطاريات، نوع المداخل المستخدمة في الأردن (مثل Type 2 و GB/T الصيني)، وحاجة المستخدم لمحوّل شحن (Adapter).
   - وضّح الفروقات الجوهرية بين الاستيراد الشخصي (بدون كفالة مصنعية) وسيارات الوكالة الرسمية.

3. **الشفافية وحدود المعرفة:**
   - **هام جداً:** جميع حسابات استهلاك الكهرباء، مدى القيادة الفعلي، وتكلفة الشحن هي تقديرات تقريبية تعتمد على ظروف تشغيل مثالية وسلوك قيادة متوسط. صرّح بذلك دائماً للمستخدم بوضوح.
   - إذا سُئلت عن سيارة غير مدعومة أو مواصفات غير متوفرة في قواعد بياناتنا، اعترف فوراً وبأدب بعدم توفرها وتجنّب تماماً اختلاق (هلوسة) تفاصيل تقنية مثل سعة البطارية أو المدى.
   - ذكّر المستخدم في نهاية الردود الحرجة (مثل مقارنة الشراء أو قرار الكفالة) بأهمية فحص السيارة في مراكز معتمدة ومراجعة الموزع أو الوكيل الرسمي قبل اتخاذ قرار نهائي.

4. **تنسيق المخرجات:**
   - رتب إجابتك بحيث تبدأ بفقرة تمهيدية ملخصة، تليها نقاط واضحة ومقروءة (Bullets)، وتنتهي بنصيحة عملية أو سؤال تفاعلي لتوجيه المستخدم.
```

---

## 8. Implementation Phases

```mermaid
gantt
    title VoltJo AI Integration Roadmap Phases
    dateFormat  YYYY-MM-DD
    section Phase 1
    Local Conversation Storage    :active, p1, 2026-05-26, 7d
    section Phase 2
    Mock /api/chat Endpoint        : p2, after p1, 4d
    section Phase 3
    Streaming UI Integration      : p3, after p2, 6d
    section Phase 4
    Real AI Provider Setup        : p4, after p3, 5d
    section Phase 5
    RAG / Specs Knowledge Base    : p5, after p4, 10d
    section Phase 6
    Auth & DB Persistence         : p6, after p5, 8d
```

### Phase 1: Local Conversation System
* **Goal:** Enable users to keep local chat histories.
* **Tasks:**
  * Refactor `components/chat/ChatSidebar.tsx` to read the list of active chat threads from local storage.
  * Integrate `lib/chat/storage.ts` using simple `window.localStorage` serialize/deserialize routines.
  * Ensure user can clear history or delete single threads offline.

### Phase 2: Mock Server Endpoint `/api/chat`
* **Goal:** Verify pipeline architecture with local server request-response loops.
* **Tasks:**
  * Build the Next.js API route (`app/api/chat/route.ts`) returning static JSON payloads.
  * Update client-side dispatch in `ChatShell` to issue a real `fetch('/api/chat', ...)` request instead of relying on the local mock-chat file directly.

### Phase 3: Streaming UI
* **Goal:** Provide a responsive typing effect driven by server chunks.
* **Tasks:**
  * Implement server-side streaming headers in the API route.
  * Update `ChatShell` submission handler to use an async reader (`ReadableStreamDefaultReader`) to loop over text/event-stream chunks.
  * Smoothly append incoming characters to the active assistant message state.

### Phase 4: Real AI Provider (OpenAI Integration)
* **Goal:** Connect a live LLM engine using production keys.
* **Tasks:**
  * Install secure peer dependencies like `openai` or `@ai-sdk/openai`.
  * Set up environment secrets in `.env.local`.
  * Configure system prompts and model selection logic in `lib/ai/providers/openai.ts`.

### Phase 5: Vehicle Knowledge Base (RAG)
* **Goal:** Eliminate speculation about car battery sizes and specifications.
* **Tasks:**
  * Inject local structured files (e.g., `data/supported-brands.ts` and vehicle specs sheets) into the model's runtime context.
  * Implement basic Retrieval-Augmented Generation (RAG) using lightweight keywords or semantic embeddings.

### Phase 6: Cloud Persistence & User Accounts
* **Goal:** Allow cross-device access and full database persistence.
* **Tasks:**
  * Integrate authorization checks (e.g. NextAuth or supabase-auth) to protect API resources.
  * Save conversation records in a SQL or NoSQL database.

---

## 9. Risks and Best Practices

1. **Client-Side Key Leakage:**
   * *Risk:* Hardcoding `OPENAI_API_KEY` or referencing it in a utility imported by frontend code.
   * *Mitigation:* Restrict all provider references to code that executes inside Next.js server-side route handlers. Never prefix secrets with `NEXT_PUBLIC_`.
2. **User Input Sanitation:**
   * *Risk:* Prompt injection, SQL injection, or excessive token usage via repetitive inputs.
   * *Mitigation:* Truncate user messages exceeding character limits (e.g., max 1000 chars) and reject suspicious payload loops before invoking API.
3. **Rate Limiting:**
   * *Risk:* API key exploitation causing unexpected usage bills.
   * *Mitigation:* Implement basic IP-based or session-based rate limiting (using Redis or Next.js middleware) restricting queries to a safe limit (e.g., 20 requests per hour per user).
4. **Arabic RTL Text Formatting:**
   * *Risk:* Mixed script texts (Arabic + Latin words) formatting incorrectly, shifting bullet points, or placing punctuation on the wrong side.
   * *Mitigation:* Ensure markdown containers have continuous CSS attributes `dir="rtl"` and `text-right`, and surround Latin model terms with spacing or specific spans where necessary.
5. **Spec Hallucinations:**
   * *Risk:* The AI advising a user that a car has a GB/T charger when it uses Type 2, leading to expensive purchasing mistakes.
   * *Mitigation:* Rigorously prompt-engineer the system instructions to force a "know-nothing" fallback posture when vehicle data is outside the provided local knowledge bases.

---

## 10. Pre-Flight Checklist (Before Connecting API Key)

* [ ] **Local Storage Check:** Verified that basic client-side localStorage features are fully functional.
* [ ] **Mock Endpoint Test:** Validated `/api/chat` with offline mock responses to ensure network payload parsing handles Arabic character sets correctly.
* [ ] **Limit Guards in Place:** Verified maximum input constraints on messages to prevent large tokens billing issues.
* [ ] **Error Boundaries:** Frontend displays clean user-friendly alerts when the server returns 500 or timeout states, rather than breaking the UI.
* [ ] **Rate Limiter Configured:** Placed basic rate limit controls at the API gateway layer.
* [ ] **Billing Alerts Configured:** Configured maximum usage limits, soft alerts, and monthly hard ceilings on the provider dashboard (e.g., OpenAI Console).
* [ ] **License & Privacy Policy:** Added clear disclaimers that conversations are processed by external LLMs and should not contain personally identifiable information (PII).
