# VoltJo Assistant: Pre-Backend Final Audit Checklist

This audit checklist outlines the verification criteria, user interface (UI) acceptance benchmarks, client-side conversation logic constraints, and manual QA scenarios required to validate that the `/assistant` page is fully optimized and stable before initiating backend API integration.

---

## 1. Current Completed Local Features
Verify that all of the following client-side functionalities are stable and functional under mock execution:
* [ ] **Local Conversations state:** Client holds an active in-memory array of chat threads.
* [ ] **`localStorage` Persistence:** Client successfully serializes conversation objects to and from browser memory (allowing thread persistence between browser page loads).
* [ ] **Active Conversation Focus:** Clicking a past thread in the sidebar successfully mounts the selected message array in the main viewport.
* [ ] **Sidebar Filters:** Categories like "السيارات", "المقارنة", "الحاسبات", and "الدعم والضمان" load corresponding starter prompts or filter threads correctly.
* [ ] **Search:** Quick indexing over local chat titles or content snippets works instantly.
* [ ] **Mock Assistant Replies:** The client triggers `simulateChatResponse` locally, yielding structured mock bullet replies with artificial latency.
* [ ] **Attachments Metadata:** Selecting file uploads validates file sizes/types, updates local state metadata, and prints proper toast boundaries.
* [ ] **Account Menu:** The profile widget at the bottom of the sidebar opens settings, showing local status (e.g. "نسخة تجريبية").

---

## 2. UI Acceptance Checklist
Ensure all UI layers meet VoltJo's high-aesthetic, RTL, and responsiveness standards:
* [ ] **Overall Layout:** Main wrapper uses `100dvh` (dynamic viewport height) to prevent viewport clipping and double scrollbar artifacts.
* [ ] **Sidebar Layout:** Responds cleanly to desktop collapse/expand toggles, preserving button text visibility and icon spacing.
* [ ] **Composer Input:** Input field automatically handles multi-line overflow, scroll behavior, and limits input length gracefully.
* [ ] **Message Thread Viewport:** Messages utilize soft speech bubbles. Assistant messages align to the right/center; user messages align to the left/center.
* [ ] **Mobile Behavior:** Sidebar slides off-screen or collapses behind a backdrop on viewports `< 1024px`, leaving a prominent burger button.
* [ ] **Arabic RTL Integrity:**
  * [ ] CSS attributes `dir="rtl"` are consistently forced on core thread parents.
  * [ ] Text alignment (`text-right`) ensures sentences do not read backwards when mixed with Latin numbers, acronyms (e.g., "BYD", "GB/T"), or punctuation.
* [ ] **Empty States:** The welcome dashboard shows helpful suggestion cards when no thread history exists.
* [ ] **Loading States:** Displays a smooth, non-disruptive pulsing skeleton ("جاري التفكير...") while awaiting responses.
* [ ] **Error States:** Generates clean, visible error alerts within the viewport if an operation fails, without breaking the core layout shell.

---

## 3. Local Conversation Checklist
Audit the client-side state machine for edge cases and history handling:
* [ ] **Create New Conversation:** Clicking "محادثة جديدة" creates a fresh session ID, resets the viewport, and preserves previous conversations in history.
* [ ] **Prevent Duplicate Empty Chats:** Opening a new conversation does not write a blank, untitled slot to `localStorage` until the user sends their first message.
* [ ] **Append Messages:** Sent and received messages append sequentially to the state, retaining chronological order.
* [ ] **Reopen Past Conversations:** Clicking an older thread correctly parses its stored messages back into the thread renderer.
* [ ] **Delete Conversation:** Deleting a thread removes it from `localStorage`, adjusts the index list, and falls back to a clean welcome state.
* [ ] **Export Conversations:** Users can download their history as a structured `.json` backup file.
* [ ] **Clear All Conversations:** A destructive action that completely resets `localStorage` history after a security confirmation prompt.
* [ ] **Persistence Auto-Refresh:** Modifying state (adding, deleting, or renaming a thread) immediately commits the update to `localStorage`.

---

## 4. Backend Readiness Checklist
Assess whether the code structure is prepared for network calls:
* [ ] **Unified Submission Handler:** The `submitPrompt()` routine inside `ChatShell.tsx` is structured so it can be swapped from calling local `simulateChatResponse` to making a `fetch("/api/chat")` network request with minimal refactoring.
* [ ] **Streaming Support:** The thread renderer is prepared to handle incremental text updates (e.g., appending text chunks dynamically) without causing excessive cursor jumps or scroll failures.
* [ ] **Message Status Attribute:** Each message data type supports standard progression metadata (`id`, `role`, `content`, `createdAt`, `status: "sending" | "done" | "error"`).
* [ ] **Locked Upload Payload:** Attachments are currently treated as client-side UI tokens; the code prevents attempting uploads until a dedicated backend endpoint is introduced.
* [ ] **Strict Client-Side Key Isolation:** Absolutely no vendor keys (e.g., `OPENAI_API_KEY`) are present in local code, client-side configuration parameters, or `.env` files exposed to browser bundles.
* [ ] **Visible Response Errors:** The frontend is configured to catch standard HTTP server errors (401, 429, 500) and render them gracefully inside the chat.

---

## 5. Manual QA Scenarios
Execute the following step-by-step test cases to guarantee stable client-side execution:

### Scenario 1: First-Time User Visit
1. Open the browser in Incognito mode and navigate to `/assistant`.
2. Verify that the welcome page loads showing clean starter cards and an empty sidebar with no past threads.
3. Validate that RTL alignment defaults correctly to Arabic.

### Scenario 2: Starting a New Chat
1. Click the input bar, type "هل تدعم المنصة سيارات تسلا؟", and press Enter or click send.
2. Confirm the user message displays instantly on the left with a "sending" state.
3. Confirm the mock loader ("جاري التفكير...") pulses smoothly during wait times.
4. Verify the mock assistant reply renders correctly with bullet points.
5. Verify the sidebar now lists a new thread titled "سيارات تسلا" (or the first query string).

### Scenario 3: Continuous Conversation
1. In the same thread, send a second question: "كم تكلفة شحنها؟".
2. Confirm that both the previous context and the new query reside within the same thread.
3. Confirm the active session index in the sidebar remains highlighted.

### Scenario 4: Browser Reload Persistence
1. With the active chat open, refresh the browser page.
2. Confirm the page reloads, the sidebar lists the thread created in Scenario 2, and clicking it restores the complete message history.

### Scenario 5: Title Search
1. Create a second chat titled "مقارنة سيارات بي واي دي".
2. Use the sidebar search bar to search for "تسلا".
3. Validate that the thread list filters instantly, hiding the "بي واي دي" thread.
4. Clear the search and ensure both threads reappear.

### Scenario 6: Category Quick Actions
1. Click the "محادثة جديدة" button.
2. Click the "المقارنة" helper card.
3. Confirm that the input field auto-populates with: `"أريد مقارنة بين سيارتين من حيث التكلفة والمدى والدعم."`.
4. Click send and verify the thread processes successfully.

### Scenario 7: Active Thread Deletion
1. Select an active conversation.
2. Click the Delete/Trash icon next to its name.
3. Confirm that the thread is removed, the welcome screen mounts, and the sidebar clears the entry.

### Scenario 8: Database Export
1. Click the settings/export action in the sidebar.
2. Choose "تصدير المحادثات".
3. Verify that a `.json` file downloads, containing a valid array of active session messages.

### Scenario 9: Hard Reset
1. Click the "Clear All History" option.
2. Confirm the secondary confirmation warning modal.
3. Validate that all active chats are removed from both the sidebar and the browser's `localStorage` namespace.

### Scenario 10: File Attachments Mocking
1. Click the attachment paperclip icon.
2. Select a local image or PDF file.
3. Confirm the UI renders a badge/token representing the attached file.
4. Verify that submitting the prompt triggers a toast or notice indicating: `"رفع المرفقات غير مفعّل في هذه النسخة التجريبية."`.

### Scenario 11: Mobile Sidebar Toggle
1. Resize the browser viewport down to a mobile resolution (e.g., width `390px`).
2. Verify the sidebar automatically collapses off-canvas.
3. Click the menu button in the top navigation bar.
4. Verify the sidebar slides out smoothly overlaying the viewport.
5. Click the backdrop or "إغلاق" button and verify it hides correctly.

---

## 6. Definition of Done Before API Phase
The frontend implementation is officially declared **Ready for Backend Integration** only when all of the following conditions are met:

- [ ] **100% QA Pass:** All 11 manual QA scenarios described in Section 5 pass without console exceptions or crashes.
- [ ] **Client State Modularity:** All local state structures are stored separately from presentation components (e.g., helper functions in `lib/chat/` handle persistence updates).
- [ ] **CSS RTL Compliance:** Punctuation and layout containers rendering mixed language strings do not experience directional layout shifting.
- [ ] **No Credentials:** A thorough codebase grep verifies that zero secret tokens or provider credentials exist in repository source code.
- [ ] **Standardized DTOs:** Message structures map perfectly to backend specifications (`id`, `role`, `content`, `bullets`, `createdAt`).
