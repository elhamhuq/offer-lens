import { OpenAIEmbeddings } from "@langchain/openai"
import { Document } from "langchain/document"
import { supabase } from "./supabase"
import type { JobOfferEmbeddingRow } from "@/types/analysis"

export interface EmbeddingProgress {
  processed: number
  total: number
  stage: 'generating' | 'storing' | 'completed'
  message: string
}

export interface EmbeddingResult {
  embeddings: JobOfferEmbeddingRow[]
  totalTokens: number
  processingTime: number
}

export class EmbeddingService {
  private static embeddings: OpenAIEmbeddings | null = null
  private static readonly BATCH_SIZE = 100 // Process embeddings in batches
  private static readonly MAX_RETRIES = 3
  private static getClient() {
    return supabase
  }

  /**
   * Initialize the OpenAI embeddings client
   */
  private static getEmbeddings(): OpenAIEmbeddings {
    if (!this.embeddings) {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required')
      }

      this.embeddings = new OpenAIEmbeddings({
        apiKey,
        model: "text-embedding-3-small", // 1536-dim
        batchSize: this.BATCH_SIZE,
        maxRetries: this.MAX_RETRIES,
      })
    }
    return this.embeddings
  }

  /**
   * Generates embeddings for a batch of text chunks
   */
  static async generateEmbeddings(
    documents: Document[],
    onProgress?: (progress: EmbeddingProgress) => void
  ): Promise<number[][]> {
    const embeddingsClient = this.getEmbeddings()
    const allEmbeddings: number[][] = []

    onProgress?.({
      processed: 0,
      total: documents.length,
      stage: 'generating',
      message: 'Generating vector embeddings...'
    })

    // Process in batches to avoid rate limits
    for (let i = 0; i < documents.length; i += this.BATCH_SIZE) {
      const batch = documents.slice(i, i + this.BATCH_SIZE)
      const batchTexts = batch.map(doc => doc.pageContent)

      try {
        const batchEmbeddings = await embeddingsClient.embedDocuments(batchTexts)
        allEmbeddings.push(...batchEmbeddings)

        onProgress?.({
          processed: Math.min(i + this.BATCH_SIZE, documents.length),
          total: documents.length,
          stage: 'generating',
          message: `Generated embeddings for ${Math.min(i + this.BATCH_SIZE, documents.length)} of ${documents.length} chunks`
        })

        // Small delay to respect rate limits
        if (i + this.BATCH_SIZE < documents.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error(`Error generating embeddings for batch ${i}-${i + this.BATCH_SIZE}:`, error)
        throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return allEmbeddings
  }

  /**
   * Stores embeddings in the database
   */
  static async storeEmbeddings(
    documentAnalysisId: string,
    documents: Document[],
    embeddings: number[][],
    onProgress?: (progress: EmbeddingProgress) => void,
    client?: any
  ): Promise<JobOfferEmbeddingRow[]> {
    if (documents.length !== embeddings.length) {
      throw new Error('Number of documents and embeddings must match')
    }

    onProgress?.({
      processed: 0,
      total: documents.length,
      stage: 'storing',
      message: 'Storing embeddings in database...'
    })

    const embeddingRows: JobOfferEmbeddingRow[] = []

    // Store embeddings in batches
    for (let i = 0; i < documents.length; i += this.BATCH_SIZE) {
      const batch = documents.slice(i, i + this.BATCH_SIZE)
      const batchEmbeddings = embeddings.slice(i, i + this.BATCH_SIZE)

      const batchRows = batch.map((doc, index) => ({
        document_analysis_id: documentAnalysisId,
        chunk_text: doc.pageContent,
        embedding: batchEmbeddings[index],
        chunk_index: doc.metadata.chunkIndex,
        metadata: {
          chunkLength: doc.pageContent.length,
          filename: doc.metadata.filename,
          userId: doc.metadata.userId,
          extractedAt: doc.metadata.timestamp
        }
      }))

      try {
        const supabaseClient = client || this.getClient()
        const { data, error } = await supabaseClient
          .from('job_offer_embeddings')
          .insert(batchRows)
          .select()

        if (error) {
          throw new Error(`Failed to store embeddings: ${error.message}`)
        }

        embeddingRows.push(...(data || []))

        onProgress?.({
          processed: Math.min(i + this.BATCH_SIZE, documents.length),
          total: documents.length,
          stage: 'storing',
          message: `Stored ${Math.min(i + this.BATCH_SIZE, documents.length)} of ${documents.length} embeddings`
        })
      } catch (error) {
        console.error(`Error storing embeddings for batch ${i}-${i + this.BATCH_SIZE}:`, error)
        throw new Error(`Failed to store embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return embeddingRows
  }

  /**
   * Performs semantic search on stored embeddings
   */
  static async semanticSearch(
    query: string,
    documentAnalysisIds: string[],
    limit: number = 10,
    similarityThreshold: number = 0.7
  ): Promise<{
    results: Array<{
      chunk: string
      similarity: number
      metadata: any
      documentAnalysisId: string
    }>
    totalTokens: number
  }> {
    const embeddingsClient = this.getEmbeddings()

    // Generate embedding for the query
    const queryEmbedding = await embeddingsClient.embedQuery(query)

    // Perform vector similarity search using Supabase
    const { data, error } = await this.getClient().rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: similarityThreshold,
      match_count: limit,
      document_analysis_ids: documentAnalysisIds
    })

    if (error) {
      throw new Error(`Semantic search failed: ${error.message}`)
    }

    return {
      results: data || [],
      totalTokens: queryEmbedding.length // Rough estimate
    }
  }

  /**
   * Complete embedding pipeline: generate and store embeddings
   */
  static async processEmbeddings(
    documentAnalysisId: string,
    documents: Document[],
    onProgress?: (progress: EmbeddingProgress) => void
  ): Promise<EmbeddingResult> {
    const startTime = Date.now()

    // Generate embeddings
    const embeddings = await this.generateEmbeddings(documents, onProgress)

    // Store embeddings
    const embeddingRows = await this.storeEmbeddings(
      documentAnalysisId,
      documents,
      embeddings,
      onProgress
    )

    const processingTime = Date.now() - startTime
    const totalTokens = embeddings.length * 1536 // OpenAI text-embedding-3-small dimensions

    onProgress?.({
      processed: documents.length,
      total: documents.length,
      stage: 'completed',
      message: `Successfully processed ${documents.length} embeddings in ${Math.round(processingTime / 1000)}s`
    })

    return {
      embeddings: embeddingRows,
      totalTokens,
      processingTime
    }
  }

  /**
   * Clean up embeddings for a document analysis
   */
  static async deleteEmbeddings(documentAnalysisId: string): Promise<void> {
    const { error } = await this.getClient()
      .from('job_offer_embeddings')
      .delete()
      .eq('document_analysis_id', documentAnalysisId)

    if (error) {
      throw new Error(`Failed to delete embeddings: ${error.message}`)
    }
  }

  /**
   * Get embedding statistics for a document analysis
   */
  static async getEmbeddingStats(documentAnalysisId: string): Promise<{
    totalChunks: number
    averageChunkLength: number
    totalTokens: number
  }> {
    const { data, error } = await this.getClient()
      .from('job_offer_embeddings')
      .select('chunk_text, chunk_index')
      .eq('document_analysis_id', documentAnalysisId)
      .order('chunk_index')

    if (error) {
      throw new Error(`Failed to get embedding stats: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return {
        totalChunks: 0,
        averageChunkLength: 0,
        totalTokens: 0
      }
    }

    const totalChunks = data.length
    const totalLength = data.reduce((sum, row) => sum + row.chunk_text.length, 0)
    const averageChunkLength = totalLength / totalChunks
    const totalTokens = totalChunks * 1536 // OpenAI text-embedding-3-small dimensions

    return {
      totalChunks,
      averageChunkLength,
      totalTokens
    }
  }
}

export default EmbeddingService
