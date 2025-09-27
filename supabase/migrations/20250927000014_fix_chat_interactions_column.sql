-- Fix chat_interactions table column name
DO $$
BEGIN
  -- Check if analysis_id column exists and document_analysis_id doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chat_interactions' 
            AND column_name = 'analysis_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'chat_interactions' 
                    AND column_name = 'document_analysis_id') THEN
    
    -- Rename the column
    ALTER TABLE public.chat_interactions 
    RENAME COLUMN analysis_id TO document_analysis_id;
    
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'chat_interactions' 
                   AND column_name = 'document_analysis_id') THEN
    
    -- Add the column if it doesn't exist
    ALTER TABLE public.chat_interactions 
    ADD COLUMN document_analysis_id UUID REFERENCES public.document_analysis(id) ON DELETE CASCADE;
    
  END IF;
END $$;
