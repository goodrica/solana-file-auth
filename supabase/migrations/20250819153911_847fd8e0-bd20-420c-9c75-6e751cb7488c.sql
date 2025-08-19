-- Add user_id column to file_authentications table
ALTER TABLE public.file_authentications 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to be user-specific
DROP POLICY IF EXISTS "Public read access for file authentications" ON public.file_authentications;
DROP POLICY IF EXISTS "Public insert access for file authentications" ON public.file_authentications;

-- Create user-specific policies
CREATE POLICY "Users can view their own file authentications" 
ON public.file_authentications 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own file authentications" 
ON public.file_authentications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_file_authentications_user_id ON public.file_authentications(user_id);