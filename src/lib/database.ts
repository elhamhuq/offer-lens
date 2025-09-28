import { supabase, Database } from './supabase'

// Type definitions
type Scenario = Database['public']['Tables']['scenarios']['Row']
type ScenarioInsert = Database['public']['Tables']['scenarios']['Insert']
type ScenarioUpdate = Database['public']['Tables']['scenarios']['Update']

type DocumentAnalysis = Database['public']['Tables']['document_analysis']['Row']
type DocumentAnalysisInsert = Database['public']['Tables']['document_analysis']['Insert']
type DocumentAnalysisUpdate = Database['public']['Tables']['document_analysis']['Update']

type JobOfferEmbedding = Database['public']['Tables']['job_offer_embeddings']['Row']
type JobOfferEmbeddingInsert = Database['public']['Tables']['job_offer_embeddings']['Insert']
type JobOfferEmbeddingUpdate = Database['public']['Tables']['job_offer_embeddings']['Update']

type ChatInteraction = Database['public']['Tables']['chat_interactions']['Row']
type ChatInteractionInsert = Database['public']['Tables']['chat_interactions']['Insert']
type ChatInteractionUpdate = Database['public']['Tables']['chat_interactions']['Update']

// Scenarios CRUD operations
export const scenariosDb = {
  // Create a new scenario
  async create(scenarioData: ScenarioInsert): Promise<Scenario | null> {
    const { data, error } = await supabase
      .from('scenarios')
      .insert(scenarioData)
      .select()
      .single()

    if (error) {
      console.error('Error creating scenario:', error)
      return null
    }

    return data
  },

  // Get scenario by ID
  async getById(id: string): Promise<Scenario | null> {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching scenario:', error)
      return null
    }

    return data
  },

  // Get scenarios by user ID
  async getByUserId(userId: string): Promise<Scenario[]> {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching scenarios:', error)
      return []
    }

    return data || []
  },

  // Update scenario
  async update(id: string, updates: ScenarioUpdate): Promise<Scenario | null> {
    const { data, error } = await supabase
      .from('scenarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating scenario:', error)
      return null
    }

    return data
  },

  // Delete scenario
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting scenario:', error)
      return false
    }

    return true
  }
}

// Document Analysis CRUD operations
export const documentAnalysisDb = {
  // Create a new document analysis
  async create(analysisData: DocumentAnalysisInsert): Promise<DocumentAnalysis | null> {
    const { data, error } = await supabase
      .from('document_analysis')
      .insert(analysisData)
      .select()
      .single()

    if (error) {
      console.error('Error creating document analysis:', error)
      return null
    }

    return data
  },

  // Get document analysis by ID
  async getById(id: string): Promise<DocumentAnalysis | null> {
    const { data, error } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching document analysis:', error)
      return null
    }

    return data
  },

  // Get document analyses by user ID
  async getByUserId(userId: string): Promise<DocumentAnalysis[]> {
    const { data, error } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching document analyses:', error)
      return []
    }

    return data || []
  },

  // Update document analysis
  async update(id: string, updates: DocumentAnalysisUpdate): Promise<DocumentAnalysis | null> {
    const { data, error } = await supabase
      .from('document_analysis')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating document analysis:', error)
      return null
    }

    return data
  },

  // Delete document analysis
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('document_analysis')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting document analysis:', error)
      return false
    }

    return true
  }
}

// Chat Interaction CRUD operations
export const chatInteractionDb = {
  // Create a new chat interaction
  async create(interactionData: ChatInteractionInsert): Promise<ChatInteraction | null> {
    const { data, error } = await supabase
      .from('chat_interactions')
      .insert(interactionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating chat interaction:', error)
      return null
    }

    return data
  },

  // Get chat interactions by analysis ID
  async getByAnalysisId(analysisId: string): Promise<ChatInteraction[]> {
    const { data, error } = await supabase
      .from('chat_interactions')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chat interactions:', error)
      return []
    }

    return data || []
  }
}