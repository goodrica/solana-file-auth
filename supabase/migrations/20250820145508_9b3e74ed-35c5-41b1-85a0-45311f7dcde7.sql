-- Create user credits table to track authentication usage
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  free_credits_remaining INTEGER NOT NULL DEFAULT 10,
  purchased_credits INTEGER NOT NULL DEFAULT 0,
  total_authentications INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits" 
ON public.user_credits 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own credits (for purchasing tokens later)
CREATE POLICY "Users can update their own credits" 
ON public.user_credits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow inserting new user credits
CREATE POLICY "Users can create their own credits" 
ON public.user_credits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all credits (for edge functions)
CREATE POLICY "Service role can manage all credits" 
ON public.user_credits 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize user credits when they first authenticate
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, free_credits_remaining, purchased_credits, total_authentications)
  VALUES (NEW.user_id, 10, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize credits when user first authenticates a file
CREATE TRIGGER initialize_credits_on_first_auth
AFTER INSERT ON public.file_authentications
FOR EACH ROW
EXECUTE FUNCTION public.initialize_user_credits();