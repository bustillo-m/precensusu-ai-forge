-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  ai_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_plans table
CREATE TABLE public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'freemium' CHECK (plan_type IN ('freemium', 'starter', 'pro', 'premium', 'enterprise')),
  consultations_used INTEGER DEFAULT 0,
  automations_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations" ON public.conversations
  FOR DELETE USING (user_id = auth.uid());

-- Create policies for messages
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Create policies for user_plans
CREATE POLICY "Users can view their own plan" ON public.user_plans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own plan" ON public.user_plans
  FOR UPDATE USING (user_id = auth.uid());

-- Create function to automatically create user plan on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_plans (user_id, plan_type)
  VALUES (NEW.id, 'freemium');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create n8n_workflows table to track sent workflows
CREATE TABLE public.n8n_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  n8n_workflow_id TEXT,
  workflow_name TEXT NOT NULL,
  workflow_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'active', 'inactive', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for n8n_workflows
ALTER TABLE public.n8n_workflows ENABLE ROW LEVEL SECURITY;

-- Create policies for n8n_workflows
CREATE POLICY "Users can view their own n8n workflows" ON public.n8n_workflows
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own n8n workflows" ON public.n8n_workflows
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own n8n workflows" ON public.n8n_workflows
  FOR UPDATE USING (user_id = auth.uid());