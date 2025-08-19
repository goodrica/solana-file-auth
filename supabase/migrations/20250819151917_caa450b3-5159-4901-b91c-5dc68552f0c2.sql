-- Create table for file authentications
CREATE TABLE public.file_authentications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_hash TEXT NOT NULL UNIQUE,
  file_name TEXT,
  file_size BIGINT,
  blockchain_network TEXT NOT NULL DEFAULT 'solana',
  authenticated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.file_authentications ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since verification should be publicly available)
CREATE POLICY "Public read access for file authentications" 
ON public.file_authentications 
FOR SELECT 
USING (true);

-- Create policy for public insert access (since anyone should be able to authenticate files)
CREATE POLICY "Public insert access for file authentications" 
ON public.file_authentications 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster hash lookups
CREATE INDEX idx_file_authentications_hash ON public.file_authentications(file_hash);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_file_authentications_updated_at
BEFORE UPDATE ON public.file_authentications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();