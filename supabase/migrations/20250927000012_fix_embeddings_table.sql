-- Add missing columns to job_offer_embeddings if they don't exist
DO $$ 
BEGIN
  -- Add analysis_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'job_offer_embeddings' 
                AND column_name = 'analysis_id') THEN
    ALTER TABLE public.job_offer_embeddings ADD COLUMN analysis_id UUID;
  END IF;
  
  -- Add user_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'job_offer_embeddings' 
                AND column_name = 'user_id') THEN
    ALTER TABLE public.job_offer_embeddings ADD COLUMN user_id UUID;
  END IF;
  
  -- Add chunk_index if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'job_offer_embeddings' 
                AND column_name = 'chunk_index') THEN
    ALTER TABLE public.job_offer_embeddings ADD COLUMN chunk_index INTEGER;
  END IF;
  
  -- Add chunk_text if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'job_offer_embeddings' 
                AND column_name = 'chunk_text') THEN
    ALTER TABLE public.job_offer_embeddings ADD COLUMN chunk_text TEXT;
  END IF;
  
  -- Add metadata if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'job_offer_embeddings' 
                AND column_name = 'metadata') THEN
    ALTER TABLE public.job_offer_embeddings ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_job_offer_embeddings_analysis_id 
ON public.job_offer_embeddings(analysis_id) WHERE analysis_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_offer_embeddings_user_id 
ON public.job_offer_embeddings(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.job_offer_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_offer_embeddings' 
    AND policyname = 'Users can view own embeddings'
  ) THEN
    CREATE POLICY "Users can view own embeddings"
      ON public.job_offer_embeddings FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_offer_embeddings' 
    AND policyname = 'Users can insert own embeddings'
  ) THEN
    CREATE POLICY "Users can insert own embeddings"
      ON public.job_offer_embeddings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_offer_embeddings' 
    AND policyname = 'Users can update own embeddings'
  ) THEN
    CREATE POLICY "Users can update own embeddings"
      ON public.job_offer_embeddings FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_offer_embeddings' 
    AND policyname = 'Users can delete own embeddings'
  ) THEN
    CREATE POLICY "Users can delete own embeddings"
      ON public.job_offer_embeddings FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.job_offer_embeddings TO authenticated;
