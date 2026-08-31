-- Security hardening migration (2026-08-30)
-- Adds: processed_transactions for idempotency, purchase_audit for
-- audit logs, role column on user_profiles for admin gating.

-- ── processed_transactions ───────────────────────────────────────
-- Prevents replay of the same on-chain transaction across users or
-- across multiple credit operations.
CREATE TABLE IF NOT EXISTS public.processed_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signature TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  amount_lamports BIGINT,
  credits_credited INTEGER,
  destination_address TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.processed_transactions ENABLE ROW LEVEL SECURITY;

-- Users can see their own processed transactions (for receipts)
CREATE POLICY "Users can view their own processed transactions"
ON public.processed_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role manages processed_transactions (inserts happen from edge functions)
CREATE POLICY "Service role manages processed transactions"
ON public.processed_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for the unique-signature lookup
CREATE INDEX IF NOT EXISTS idx_processed_transactions_signature
ON public.processed_transactions (signature);

-- ── purchase_audit ───────────────────────────────────────────────
-- Structured audit trail for every credit-mutating operation.
CREATE TABLE IF NOT EXISTS public.purchase_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,             -- 'confirm_purchase' | 'process_airdrop' | 'authenticate' | etc.
  amount_credits INTEGER,
  signature TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_audit ENABLE ROW LEVEL SECURITY;

-- Only service role can write; admins can read all
CREATE POLICY "Service role manages purchase_audit"
ON public.purchase_audit
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_purchase_audit_created_at
ON public.purchase_audit (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_audit_user_id
ON public.purchase_audit (user_id);

-- ── role column on user_profiles ──────────────────────────────────
-- Default 'user'. Admins are manually promoted via:
--   UPDATE user_profiles SET role = 'admin' WHERE user_id = '...';
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin', 'service'));

-- Index for admin lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role
ON public.user_profiles (role)
WHERE role != 'user';

-- ── Constraint: cap per-airdrop credit grant ──────────────────────
-- The edge function reads campaign.token_amount and trusts it.
-- Belt-and-suspenders: cap it in the DB too.
ALTER TABLE public.airdrop_campaigns
DROP CONSTRAINT IF EXISTS airdrop_token_amount_cap;
ALTER TABLE public.airdrop_campaigns
ADD CONSTRAINT airdrop_token_amount_cap
CHECK (token_amount > 0 AND token_amount <= 100000);
