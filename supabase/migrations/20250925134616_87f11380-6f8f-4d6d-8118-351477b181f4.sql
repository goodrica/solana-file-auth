-- Update the initialize_user_credits function to grant 100 free credits instead of 10
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, free_credits_remaining, purchased_credits, total_authentications)
  VALUES (NEW.user_id, 100, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;