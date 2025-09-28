// Analysis-related TypeScript interfaces for RAG PDF processing

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ExtractedData {
  company: string
  jobTitle: string
  baseSalary: number
  location: string
  benefits: string[]
  startDate?: string
  reportingStructure?: string
  additionalInfo?: string
}

export interface ConfidenceScores {
  company: number
  jobTitle: number
  baseSalary: number
  location: number
  benefits: number
  startDate?: number
  reportingStructure?: number
  additionalInfo?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface DocumentAnalysis {
  id: string
  userId: string
  scenarioId?: string
  originalFilename: string
  fileSizeBytes: number
  processingStatus: ProcessingStatus
  confidenceScores: ConfidenceScores
  extractedData: ExtractedData
  aiAnalysis?: string
  conversationHistory: ChatMessage[]
  errorMessage?: string
  processingStartedAt?: Date
  processingCompletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface JobOfferEmbedding {
  id: string
  documentAnalysisId: string
  chunkText: string
  embedding: number[] // Vector embedding (1536 dimensions for OpenAI)
  chunkIndex: number
  metadata?: Record<string, any>
  createdAt: Date
}

export interface AnalysisRequest {
  filename: string
  fileSizeBytes: number
  userId: string
}

export interface AnalysisResponse {
  id: string
  status: ProcessingStatus
  extractedData?: ExtractedData
  confidenceScores?: ConfidenceScores
  aiAnalysis?: string
  errorMessage?: string
  processingStartedAt?: Date
  processingCompletedAt?: Date
}

export interface ChatRequest {
  message: string
  documentAnalysisId: string
  userId: string
}

export interface ChatResponse {
  message: ChatMessage
  context?: string
  suggestions?: string[]
}

export interface AnalysisHistoryItem {
  id: string
  originalFilename: string
  processingStatus: ProcessingStatus
  extractedData?: ExtractedData
  aiAnalysis?: string
  createdAt: Date
  updatedAt: Date
}

// Database row types (matching the actual database schema)
export interface DocumentAnalysisRow {
  id: string
  user_id: string
  scenario_id?: string
  original_filename: string
  file_size_bytes: number
  processing_status: ProcessingStatus
  confidence_scores: ConfidenceScores
  extracted_data: ExtractedData
  ai_analysis?: string
  conversation_history: ChatMessage[]
  error_message?: string
  processing_started_at?: string
  processing_completed_at?: string
  created_at: string
  updated_at: string
}

export interface JobOfferEmbeddingRow {
  id: string
  document_analysis_id: string
  chunk_text: string
  embedding: number[]
  chunk_index: number
  metadata?: Record<string, any>
  created_at: string
}

// API request/response types
export interface UploadAnalysisRequest {
  file: File
  userId: string
}

export interface UpdateExtractedDataRequest {
  documentAnalysisId: string
  extractedData: Partial<ExtractedData>
  userId: string
}

export interface GetAnalysisHistoryRequest {
  userId: string
  limit?: number
  offset?: number
  status?: ProcessingStatus
}

export interface GetAnalysisHistoryResponse {
  analyses: AnalysisHistoryItem[]
  totalCount: number
  hasMore: boolean
}

// Add this to your existing types/analysis.ts file

export interface FinancialAnalysis {
  summary: string
  keyInsights: Array<{
    category: string
    insight: string
    impact: 'positive' | 'negative' | 'neutral'
  }>
  monthlyBreakdown: {
    grossIncome: number
    estimatedTaxes: number
    netIncome: number
    estimatedExpenses?: number
    savingsPotential?: number
  }
  recommendations: string[]
  comparisonPoints: Array<{
    factor: string
    value: string
    benchmark?: string
  }>
}


