-- Update the default free credits from 10 to 100 for new users
ALTER TABLE public.user_credits ALTER COLUMN free_credits_remaining SET DEFAULT 100;

-- Update existing users who still have the original 10 free credits to 100
UPDATE public.user_credits 
SET free_credits_remaining = 100 
WHERE free_credits_remaining = 10 AND purchased_credits = 0 AND total_authentications = 0;