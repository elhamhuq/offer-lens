-- Create RLS policies for job_offer_embeddings if they don't exist
DO $$
BEGIN
  -- Policy for SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_offer_embeddings' 
    AND policyname = 'Users can view own embeddings'
  ) THEN
    CREATE POLICY "Users can view own embeddings"
      ON public.job_offer_embeddings FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  -- Policy for INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_offer_embeddings' 
    AND policyname = 'Users can insert own embeddings'
  ) THEN
    CREATE POLICY "Users can insert own embeddings"
      ON public.job_offer_embeddings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Policy for UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_offer_embeddings' 
    AND policyname = 'Users can update own embeddings'
  ) THEN
    CREATE POLICY "Users can update own embeddings"
      ON public.job_offer_embeddings FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  -- Policy for DELETE
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
