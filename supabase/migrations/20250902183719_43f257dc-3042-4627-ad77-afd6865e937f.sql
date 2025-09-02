-- Update default reward amount for referrals from 100 to 20
ALTER TABLE public.referrals 
ALTER COLUMN reward_amount SET DEFAULT 20;

-- Update the handle_new_user_signup function to award 20 credits instead of 100
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    ref_code TEXT;
    referrer_id UUID;
BEGIN
    -- Generate unique referral code
    ref_code := generate_referral_code();
    
    -- Insert user profile
    INSERT INTO public.user_profiles (
        user_id, 
        referral_code, 
        referred_by,
        airdrop_eligible
    ) VALUES (
        NEW.id, 
        ref_code, 
        NEW.raw_user_meta_data ->> 'referred_by',
        true
    );
    
    -- If user was referred, create referral record and award tokens
    IF NEW.raw_user_meta_data ->> 'referred_by' IS NOT NULL THEN
        SELECT user_id INTO referrer_id 
        FROM public.user_profiles 
        WHERE referral_code = NEW.raw_user_meta_data ->> 'referred_by';
        
        IF referrer_id IS NOT NULL THEN
            -- Create referral record
            INSERT INTO public.referrals (
                referrer_user_id,
                referred_user_id,
                referral_code,
                reward_amount
            ) VALUES (
                referrer_id,
                NEW.id,
                NEW.raw_user_meta_data ->> 'referred_by',
                20
            );
            
            -- Award referral bonus to referrer (20 credits instead of 100)
            INSERT INTO public.user_credits (user_id, purchased_credits)
            VALUES (referrer_id, 20)
            ON CONFLICT (user_id) 
            DO UPDATE SET purchased_credits = user_credits.purchased_credits + 20;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;