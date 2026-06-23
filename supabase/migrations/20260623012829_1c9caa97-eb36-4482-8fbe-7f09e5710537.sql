
-- 1. Fix referrals: restrict service role policy to service_role only
DROP POLICY IF EXISTS "Service role can manage all referrals" ON public.referrals;
CREATE POLICY "Service role can manage all referrals"
ON public.referrals
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Fix airdrop_participants: restrict service role policy
DROP POLICY IF EXISTS "Service role can manage all participants" ON public.airdrop_participants;
CREATE POLICY "Service role can manage all participants"
ON public.airdrop_participants
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Fix airdrop_participants: remove user-update privilege escalation
DROP POLICY IF EXISTS "Users can update their own participation" ON public.airdrop_participants;

-- 4. Fix airdrop_campaigns: restrict service role policy (covered by SUPA_rls_policy_always_true)
DROP POLICY IF EXISTS "Service role can manage all campaigns" ON public.airdrop_campaigns;
CREATE POLICY "Service role can manage all campaigns"
ON public.airdrop_campaigns
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Fix user_credits: remove client-side update privilege escalation
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

-- 6. Revoke EXECUTE on SECURITY DEFINER functions from anon and authenticated.
--    These are trigger helpers - they only need to run as triggers, not via the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user_signup() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_user_credits() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
