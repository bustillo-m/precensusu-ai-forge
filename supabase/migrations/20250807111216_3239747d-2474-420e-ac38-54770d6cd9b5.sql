-- Add role column to messages table if it doesn't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'assistant'));

-- Update existing messages to have proper role
UPDATE public.messages 
SET role = CASE 
  WHEN sender = 'user' THEN 'user'
  WHEN sender = 'ai' THEN 'assistant'
  ELSE 'user'
END
WHERE role IS NULL;