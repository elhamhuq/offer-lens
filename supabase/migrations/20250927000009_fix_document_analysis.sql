-- First, check if document_analysis table exists, if not create it
CREATE TABLE IF NOT EXISTS public.document_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT,
  file_size BIGINT,
  status TEXT DEFAULT 'pending',
  processing_status TEXT DEFAULT 'pending',
  extracted_data JSONB,
  confidence_scores JSONB,
  financial_analysis JSONB,
  formatted_analysis JSONB,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add file_size if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'document_analysis' 
                AND column_name = 'file_size') THEN
    ALTER TABLE public.document_analysis ADD COLUMN file_size BIGINT;
  END IF;
  
  -- Add filename if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'document_analysis' 
                AND column_name = 'filename') THEN
    ALTER TABLE public.document_analysis ADD COLUMN filename TEXT;
  END IF;
  
  -- Add status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'document_analysis' 
                AND column_name = 'status') THEN
    ALTER TABLE public.document_analysis ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  
  -- Add confidence_scores if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'document_analysis' 
                AND column_name = 'confidence_scores') THEN
    ALTER TABLE public.document_analysis ADD COLUMN confidence_scores JSONB;
  END IF;
  
  -- Add financial_analysis if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'document_analysis' 
                AND column_name = 'financial_analysis') THEN
    ALTER TABLE public.document_analysis ADD COLUMN financial_analysis JSONB;
  END IF;
  
  -- Add formatted_analysis if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'document_analysis' 
                AND column_name = 'formatted_analysis') THEN
    ALTER TABLE public.document_analysis ADD COLUMN formatted_analysis JSONB;
  END IF;
  
  -- Add error_message if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'document_analysis' 
                AND column_name = 'error_message') THEN
    ALTER TABLE public.document_analysis ADD COLUMN error_message TEXT;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_document_analysis_user_id 
ON public.document_analysis(user_id);

CREATE INDEX IF NOT EXISTS idx_document_analysis_status 
ON public.document_analysis(status);

CREATE INDEX IF NOT EXISTS idx_document_analysis_created_at 
ON public.document_analysis(created_at DESC);

-- Enable RLS
ALTER TABLE public.document_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_analysis' 
    AND policyname = 'Users can view own analyses'
  ) THEN
    CREATE POLICY "Users can view own analyses"
      ON public.document_analysis FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_analysis' 
    AND policyname = 'Users can insert own analyses'
  ) THEN
    CREATE POLICY "Users can insert own analyses"
      ON public.document_analysis FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_analysis' 
    AND policyname = 'Users can update own analyses'
  ) THEN
    CREATE POLICY "Users can update own analyses"
      ON public.document_analysis FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_analysis' 
    AND policyname = 'Users can delete own analyses'
  ) THEN
    CREATE POLICY "Users can delete own analyses"
      ON public.document_analysis FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.document_analysis TO authenticated;
