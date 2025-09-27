-- Revert vector dimensions back to 1536 for OpenAI embeddings
-- Safe to run multiple times

-- Ensure vector extension exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Alter embedding column to vector(1536)
ALTER TABLE IF EXISTS job_offer_embeddings
  ALTER COLUMN embedding TYPE vector(1536);

-- Drop and recreate match_embeddings function for 1536 dims
DROP FUNCTION IF EXISTS match_embeddings;

CREATE FUNCTION match_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  document_analysis_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_analysis_id UUID,
  chunk_text TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    job_offer_embeddings.id,
    job_offer_embeddings.document_analysis_id,
    job_offer_embeddings.chunk_text,
    (job_offer_embeddings.embedding <#> query_embedding) * -1 AS similarity,
    job_offer_embeddings.metadata
  FROM job_offer_embeddings
  WHERE
    (document_analysis_ids IS NULL OR job_offer_embeddings.document_analysis_id = ANY(document_analysis_ids))
    AND (job_offer_embeddings.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;



