-- Create or replace the function for matching job offer embeddings
CREATE OR REPLACE FUNCTION public.match_job_offer_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_analysis_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    joe.id,
    joe.chunk_text,
    1 - (joe.embedding <=> query_embedding) as similarity
  FROM public.job_offer_embeddings joe
  WHERE 
    (filter_analysis_id IS NULL OR joe.analysis_id = filter_analysis_id)
    AND 1 - (joe.embedding <=> query_embedding) > match_threshold
  ORDER BY joe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.match_job_offer_embeddings TO authenticated;
