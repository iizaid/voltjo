-- ============================================================
-- VoltJo Chat RLS Verification & Hardening (defense-in-depth)
-- Migration: 009_chat_rls_verification
-- Date: 2026-06-23
-- ============================================================
--
-- Production hardening pass. We treat the chat RLS posture as "broken until
-- proven otherwise" and re-assert it here idempotently, then VERIFY at the end
-- with a hard failure if anything is missing. Safe to run repeatedly.
--
-- Tables in scope: public.chat_conversations, public.chat_messages
-- Invariant: a user may only ever read/write rows where auth.uid() = user_id
-- (messages additionally gated through ownership of the parent conversation).

-- ------------------------------------------------------------
-- 1. Force RLS ON (and FORCE it even for the table owner role).
-- ------------------------------------------------------------
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. Re-assert conversation policies (idempotent).
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their chat conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their chat conversations"
  ON public.chat_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their chat conversations" ON public.chat_conversations;
CREATE POLICY "Users can create their chat conversations"
  ON public.chat_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their chat conversations" ON public.chat_conversations;
CREATE POLICY "Users can update their chat conversations"
  ON public.chat_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their chat conversations" ON public.chat_conversations;
CREATE POLICY "Users can delete their chat conversations"
  ON public.chat_conversations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. Re-assert message policies (idempotent). Ownership is enforced both via
--    the row's own user_id AND via the parent conversation's owner.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their chat messages" ON public.chat_messages;
CREATE POLICY "Users can view their chat messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create their chat messages" ON public.chat_messages;
CREATE POLICY "Users can create their chat messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their chat messages" ON public.chat_messages;
CREATE POLICY "Users can update their chat messages"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their chat messages" ON public.chat_messages;
CREATE POLICY "Users can delete their chat messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 4. VERIFY: fail the migration loudly if the posture is not exactly right.
--    This converts a silent security regression into a deploy-time error.
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
  rls_enabled boolean;
  rls_forced boolean;
  policy_count int;
BEGIN
  FOREACH t IN ARRAY ARRAY['chat_conversations', 'chat_messages'] LOOP
    SELECT c.relrowsecurity, c.relforcerowsecurity
      INTO rls_enabled, rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = t;

    IF NOT rls_enabled THEN
      RAISE EXCEPTION 'RLS verification failed: % does not have RLS enabled', t;
    END IF;
    IF NOT rls_forced THEN
      RAISE EXCEPTION 'RLS verification failed: % does not FORCE RLS', t;
    END IF;

    SELECT count(*) INTO policy_count
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = t;

    -- Expect exactly the four CRUD policies per table.
    IF policy_count < 4 THEN
      RAISE EXCEPTION 'RLS verification failed: % has % policies (expected >= 4)', t, policy_count;
    END IF;
  END LOOP;

  RAISE NOTICE 'Chat RLS verification passed: RLS enabled + forced + policies present.';
END $$;
