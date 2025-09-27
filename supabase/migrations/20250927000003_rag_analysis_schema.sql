-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_analysis table
CREATE TABLE IF NOT EXISTS document_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
    original_filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    confidence_scores JSONB DEFAULT '{}',
    extracted_data JSONB DEFAULT '{}',
    ai_analysis TEXT,
    conversation_history JSONB DEFAULT '[]',
    error_message TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_offer_embeddings table for vector storage
CREATE TABLE IF NOT EXISTS job_offer_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_analysis_id UUID NOT NULL REFERENCES document_analysis(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding dimension
    chunk_index INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_document_analysis_user_id ON document_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_document_analysis_status ON document_analysis(processing_status);
CREATE INDEX IF NOT EXISTS idx_document_analysis_created_at ON document_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_analysis_scenario_id ON document_analysis(scenario_id) WHERE scenario_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_embeddings_document_analysis_id ON job_offer_embeddings(document_analysis_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_index ON job_offer_embeddings(document_analysis_id, chunk_index);

-- Create vector similarity search index (HNSW for fast approximate nearest neighbor search)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector_cosine ON job_offer_embeddings 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Enable Row Level Security
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offer_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_analysis table
-- Users can only see and modify their own document analyses
CREATE POLICY "Users can view own document analyses" ON document_analysis
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own document analyses" ON document_analysis
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own document analyses" ON document_analysis
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own document analyses" ON document_analysis
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS Policies for job_offer_embeddings table
-- Users can only see and modify embeddings for their own document analyses
CREATE POLICY "Users can view embeddings for own analyses" ON job_offer_embeddings
    FOR SELECT USING (
        document_analysis_id IN (
            SELECT da.id FROM document_analysis da
            WHERE auth.uid()::text = da.user_id::text
        )
    );

CREATE POLICY "Users can insert embeddings for own analyses" ON job_offer_embeddings
    FOR INSERT WITH CHECK (
        document_analysis_id IN (
            SELECT da.id FROM document_analysis da
            WHERE auth.uid()::text = da.user_id::text
        )
    );

CREATE POLICY "Users can update embeddings for own analyses" ON job_offer_embeddings
    FOR UPDATE USING (
        document_analysis_id IN (
            SELECT da.id FROM document_analysis da
            WHERE auth.uid()::text = da.user_id::text
        )
    );

CREATE POLICY "Users can delete embeddings for own analyses" ON job_offer_embeddings
    FOR DELETE USING (
        document_analysis_id IN (
            SELECT da.id FROM document_analysis da
            WHERE auth.uid()::text = da.user_id::text
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_document_analysis_updated_at 
    BEFORE UPDATE ON document_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE document_analysis IS 'Stores metadata and results for PDF job offer analysis';
COMMENT ON TABLE job_offer_embeddings IS 'Stores vector embeddings for semantic search of job offer documents';

COMMENT ON COLUMN document_analysis.processing_status IS 'Current status of document processing: pending, processing, completed, failed';
COMMENT ON COLUMN document_analysis.confidence_scores IS 'JSON object with confidence scores for each extracted field';
COMMENT ON COLUMN document_analysis.extracted_data IS 'JSON object containing structured data extracted from the document';
COMMENT ON COLUMN document_analysis.ai_analysis IS 'AI-generated financial analysis and insights';
COMMENT ON COLUMN document_analysis.conversation_history IS 'JSON array storing chat history for follow-up questions';

COMMENT ON COLUMN job_offer_embeddings.embedding IS 'Vector embedding for semantic search (1536 dimensions for OpenAI)';
COMMENT ON COLUMN job_offer_embeddings.chunk_index IS 'Order index of the text chunk within the document';
