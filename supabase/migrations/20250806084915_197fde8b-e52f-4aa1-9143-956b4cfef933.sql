-- Fix security issues

-- 1. Add policy for n8n api table (it had RLS enabled but no policies)
CREATE POLICY "Admin only access to n8n api"
ON public."n8n api"
FOR ALL
USING (false);

-- 2. Fix function search path for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;