-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  document_analysis_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_text text,
  similarity float,
  metadata jsonb,
  document_analysis_id uuid,
  chunk_index int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    joe.chunk_text,
    1 - (joe.embedding <=> query_embedding) as similarity,
    joe.metadata,
    joe.document_analysis_id,
    joe.chunk_index
  FROM job_offer_embeddings joe
  WHERE 
    joe.embedding IS NOT NULL
    AND (document_analysis_ids IS NULL OR joe.document_analysis_id = ANY(document_analysis_ids))
    AND 1 - (joe.embedding <=> query_embedding) > match_threshold
  ORDER BY joe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function for finding similar documents
CREATE OR REPLACE FUNCTION find_similar_documents(
  document_analysis_id uuid,
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  similar_document_id uuid,
  similarity float,
  common_topics text[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  source_embedding vector(1536);
BEGIN
  -- Get the average embedding for the source document
  SELECT AVG(joe.embedding) INTO source_embedding
  FROM job_offer_embeddings joe
  WHERE joe.document_analysis_id = find_similar_documents.document_analysis_id
    AND joe.embedding IS NOT NULL;

  -- If no embeddings found, return empty result
  IF source_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Find similar documents
  RETURN QUERY
  SELECT
    da.id as similar_document_id,
    1 - (AVG(joe.embedding) <=> source_embedding) as similarity,
    ARRAY[]::text[] as common_topics -- Placeholder for future topic extraction
  FROM document_analysis da
  JOIN job_offer_embeddings joe ON da.id = joe.document_analysis_id
  WHERE 
    da.id != find_similar_documents.document_analysis_id
    AND joe.embedding IS NOT NULL
  GROUP BY da.id
  HAVING 1 - (AVG(joe.embedding) <=> source_embedding) > match_threshold
  ORDER BY AVG(joe.embedding) <=> source_embedding
  LIMIT match_count;
END;
$$;

-- Create index for faster vector operations
CREATE INDEX IF NOT EXISTS idx_embeddings_vector_l2 ON job_offer_embeddings 
USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Add comments for documentation
COMMENT ON FUNCTION match_embeddings IS 'Performs semantic search on job offer embeddings using cosine similarity';
COMMENT ON FUNCTION find_similar_documents IS 'Finds documents similar to a given document analysis based on embedding similarity';

