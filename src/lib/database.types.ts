// Temporary database types until we generate them from Supabase
export interface Database {
  public: {
    Tables: {
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          portfolio_data: any
          risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
          investment_horizon: 'short' | 'medium' | 'long'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          portfolio_data?: any
          risk_tolerance?: 'conservative' | 'moderate' | 'aggressive'
          investment_horizon?: 'short' | 'medium' | 'long'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          portfolio_data?: any
          risk_tolerance?: 'conservative' | 'moderate' | 'aggressive'
          investment_horizon?: 'short' | 'medium' | 'long'
          created_at?: string
          updated_at?: string
        }
      }
      scenarios: {
        Row: {
          id: string
          user_id: string
          name: string
          job_offer: any
          investments: any
          portfolio_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          job_offer: any
          investments?: any
          portfolio_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          job_offer?: any
          investments?: any
          portfolio_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_analysis: {
        Row: {
          id: string
          user_id: string
          original_filename: string | null
          file_size_bytes: number | null
          processing_status: string | null
          extracted_data: any | null
          confidence_scores: any | null
          financial_analysis: any | null
          formatted_analysis: any | null
          metadata: any | null
          error_message: string | null
          created_at: string
          processing_started_at: string | null
          processing_completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          original_filename?: string | null
          file_size_bytes?: number | null
          processing_status?: string | null
          extracted_data?: any | null
          confidence_scores?: any | null
          financial_analysis?: any | null
          formatted_analysis?: any | null
          metadata?: any | null
          error_message?: string | null
          created_at?: string
          processing_started_at?: string | null
          processing_completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          original_filename?: string | null
          file_size_bytes?: number | null
          processing_status?: string | null
          extracted_data?: any | null
          confidence_scores?: any | null
          financial_analysis?: any | null
          formatted_analysis?: any | null
          metadata?: any | null
          error_message?: string | null
          created_at?: string
          processing_started_at?: string | null
          processing_completed_at?: string | null
        }
      }
      job_offer_embeddings: {
        Row: {
          id: string
          document_analysis_id: string
          user_id: string
          chunk_index: number
          chunk_text: string
          embedding: number[]
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          document_analysis_id: string
          user_id: string
          chunk_index: number
          chunk_text: string
          embedding: number[]
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          document_analysis_id?: string
          user_id?: string
          chunk_index?: number
          chunk_text?: string
          embedding?: number[]
          metadata?: any | null
          created_at?: string
        }
      }
      chat_interactions: {
        Row: {
          id: string
          document_analysis_id: string
          user_id: string
          message: string
          response: string
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          document_analysis_id: string
          user_id: string
          message: string
          response: string
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          document_analysis_id?: string
          user_id?: string
          message?: string
          response?: string
          metadata?: any | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {
      match_job_offer_embeddings: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          filter_analysis_id?: string
        }
        Returns: {
          id: string
          chunk_text: string
          similarity: number
        }[]
      }
    }
    Enums: {}
  }
}
