-- Fix RLS policies for user_profiles to prevent wallet address harvesting
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Create secure policies that prevent wallet address harvesting
-- Only allow users to view their own profile data
CREATE POLICY "Users can view only their own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to create their own profile
CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.user_profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create a more restricted service role policy for administrative operations only
-- This policy allows service role to manage profiles for system operations (like triggers)
-- but doesn't override user access controls for regular SELECT operations
CREATE POLICY "Service role administrative access" 
ON public.user_profiles 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);