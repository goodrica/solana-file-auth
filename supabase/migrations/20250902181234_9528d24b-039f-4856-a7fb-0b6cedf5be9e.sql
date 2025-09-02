-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  reward_amount INTEGER NOT NULL DEFAULT 100
);

-- Create airdrop_campaigns table
CREATE TABLE public.airdrop_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  token_amount INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  eligibility_criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create airdrop_participants table
CREATE TABLE public.airdrop_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.airdrop_campaigns(id),
  user_id UUID NOT NULL,
  wallet_address TEXT,
  tokens_allocated INTEGER NOT NULL,
  tokens_claimed INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMP WITH TIME ZONE,
  is_eligible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Create user_profiles table for additional user data
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  signup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  airdrop_eligible BOOLEAN NOT NULL DEFAULT true,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referred_user_id);

-- RLS policies for airdrop_campaigns (public read)
CREATE POLICY "Campaigns are viewable by everyone" 
ON public.airdrop_campaigns 
FOR SELECT 
USING (is_active = true);

-- RLS policies for airdrop_participants
CREATE POLICY "Users can view their own participation" 
ON public.airdrop_participants 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" 
ON public.airdrop_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role policies for admin operations
CREATE POLICY "Service role can manage all referrals" 
ON public.referrals 
FOR ALL 
USING (true);

CREATE POLICY "Service role can manage all campaigns" 
ON public.airdrop_campaigns 
FOR ALL 
USING (true);

CREATE POLICY "Service role can manage all participants" 
ON public.airdrop_participants 
FOR ALL 
USING (true);

CREATE POLICY "Service role can manage all profiles" 
ON public.user_profiles 
FOR ALL 
USING (true);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE referral_code = code) INTO exists;
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN code;
END;
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
                referral_code
            ) VALUES (
                referrer_id,
                NEW.id,
                NEW.raw_user_meta_data ->> 'referred_by'
            );
            
            -- Award referral bonus to referrer
            INSERT INTO public.user_credits (user_id, purchased_credits)
            VALUES (referrer_id, 100)
            ON CONFLICT (user_id) 
            DO UPDATE SET purchased_credits = user_credits.purchased_credits + 100;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Add update triggers
CREATE TRIGGER update_airdrop_campaigns_updated_at
BEFORE UPDATE ON public.airdrop_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_airdrop_participants_updated_at
BEFORE UPDATE ON public.airdrop_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial airdrop campaign for early signups
INSERT INTO public.airdrop_campaigns (
    name,
    description,
    token_amount,
    end_date,
    eligibility_criteria
) VALUES (
    'Early Adopter Airdrop',
    'Free FOT tokens for users who sign up before January 1, 2026',
    1000,
    '2026-01-01 00:00:00+00',
    '{"signup_before": "2026-01-01", "verified_signup": true}'
);