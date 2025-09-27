-- Create chat_interactions table for storing conversation history
CREATE TABLE IF NOT EXISTS public.chat_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_analysis_id UUID NOT NULL REFERENCES public.document_analysis(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Indexes for performance
  CONSTRAINT chat_interactions_analysis_id_idx UNIQUE (id, analysis_id),
  CONSTRAINT chat_interactions_user_id_idx UNIQUE (id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_chat_interactions_analysis_id ON public.chat_interactions(analysis_id);
CREATE INDEX idx_chat_interactions_user_id ON public.chat_interactions(user_id);
CREATE INDEX idx_chat_interactions_created_at ON public.chat_interactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own chat interactions
CREATE POLICY "Users can view own chat interactions"
  ON public.chat_interactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own chat interactions
CREATE POLICY "Users can insert own chat interactions"
  ON public.chat_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own chat interactions
CREATE POLICY "Users can delete own chat interactions"
  ON public.chat_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.chat_interactions TO authenticated;
