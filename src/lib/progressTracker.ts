import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { ProcessingProgress } from "./documentProcessor"
import type { Database } from "./supabase"

export interface ProgressUpdate {
  documentAnalysisId: string
  stage: ProcessingProgress['stage']
  progress: number
  message: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ProcessingStatus {
  documentAnalysisId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStage: ProcessingProgress['stage']
  progress: number
  message: string
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
  estimatedTimeRemaining?: number
}

export class ProgressTracker {
  private static readonly PROGRESS_UPDATE_INTERVAL = 1000 // Update every second
  private static readonly MAX_RETRIES = 3
  private static client: SupabaseClient<Database> | null = null

  static setClient(client: SupabaseClient<Database>) {
    this.client = client
  }

  private static getClient(): SupabaseClient<Database> {
    if (this.client) {
      return this.client
    }
    return supabase as SupabaseClient<Database>
  }

  /**
   * Updates the processing status in the database
   */
  static async updateStatus(
    client: SupabaseClient<Database>,
    documentAnalysisId: string,
    status: ProcessingStatus['status'],
    stage: ProcessingProgress['stage'],
    progress: number,
    message: string,
    errorMessage?: string
  ): Promise<void> {
    // Use a type assertion to avoid TypeScript errors
    const updateData = {
      processing_status: status,
      updated_at: new Date().toISOString()
    } as Record<string, any>

    // Set timestamps based on status
    if (status === 'processing' && stage === 'uploading') {
      updateData.processing_started_at = new Date().toISOString()
    } else if (status === 'completed' || status === 'failed') {
      updateData.processing_completed_at = new Date().toISOString()
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    // Cast client to any to avoid TypeScript errors with the update method
    const supabaseClient = client as any
    const { error } = await supabaseClient
      .from('document_analysis')
      .update(updateData)
      .eq('id', documentAnalysisId)

    if (error) {
      console.error('Failed to update processing status:', error)
      throw new Error(`Failed to update status: ${error.message}`)
    }
  }

  /**
   * Gets the current processing status
   */
  static async getStatus(documentAnalysisId: string): Promise<ProcessingStatus | null> {
    const { data, error } = await this.getClient()
      .from('document_analysis')
      .select('*')
      .eq('id', documentAnalysisId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Document not found
      }
      throw new Error(`Failed to get status: ${error.message}`)
    }

    // Cast data to any to avoid TypeScript errors with dynamic properties
    const record = data as any;
    
    return {
      documentAnalysisId: record.id,
      status: record.processing_status,
      currentStage: this.mapStatusToStage(record.processing_status),
      progress: this.calculateProgress(record),
      message: this.getStatusMessage(record),
      startedAt: record.processing_started_at ? new Date(record.processing_started_at) : undefined,
      completedAt: record.processing_completed_at ? new Date(record.processing_completed_at) : undefined,
      errorMessage: record.error_message,
      estimatedTimeRemaining: this.estimateTimeRemaining(record)
    }
  }

  /**
   * Creates a progress update callback for use in processing functions
   */
  static createProgressCallback(documentAnalysisId: string) {
    // Capture the client at creation time to ensure we use the same client for all updates
    const client = this.getClient()
    
    return async (progress: ProcessingProgress) => {
      try {
        await this.updateStatus(
          client,
          documentAnalysisId,
          progress.stage === 'completed' ? 'completed' : 'processing',
          progress.stage,
          progress.progress,
          progress.message
        )
      } catch (error) {
        console.error('Failed to update progress:', error)
        // Don't throw here to avoid breaking the main process
      }
    }
  }

  /**
   * Streams progress updates using Server-Sent Events
   */
  static async streamProgress(
    documentAnalysisId: string,
    onUpdate: (status: ProcessingStatus) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const checkStatus = async () => {
      try {
        const status = await this.getStatus(documentAnalysisId)
        
        if (!status) {
          onError(new Error('Document analysis not found'))
          return
        }

        onUpdate(status)

        if (status.status === 'completed' || status.status === 'failed') {
          onComplete()
          return
        }

        // Continue polling if still processing
        if (status.status === 'processing') {
          setTimeout(checkStatus, this.PROGRESS_UPDATE_INTERVAL)
        }
      } catch (error) {
        onError(error as Error)
      }
    }

    // Start polling
    checkStatus()
  }

  /**
   * Maps database status to processing stage
   */
  private static mapStatusToStage(status: string): ProcessingProgress['stage'] {
    switch (status) {
      case 'pending':
        return 'uploading'
      case 'processing':
        return 'parsing' // Default processing stage
      case 'completed':
        return 'completed'
      case 'failed':
        return 'completed' // Failed is considered "completed" from progress perspective
      default:
        return 'uploading'
    }
  }

  /**
   * Calculates progress percentage based on processing data
   */
  private static calculateProgress(data: any): number {
    if (data.processing_status === 'completed') return 100
    if (data.processing_status === 'failed') return 100
    if (data.processing_status === 'pending') return 0
    
    // For processing status, we can't know exact progress without more context
    // This is a simplified calculation - in practice, you might store more detailed progress
    return 50
  }

  /**
   * Gets a user-friendly status message
   */
  private static getStatusMessage(data: any): string {
    switch (data.processing_status) {
      case 'pending':
        return 'Document uploaded, waiting to start processing...'
      case 'processing':
        return 'Processing document, please wait...'
      case 'completed':
        return 'Document processing completed successfully!'
      case 'failed':
        return data.error_message || 'Document processing failed'
      default:
        return 'Unknown status'
    }
  }

  /**
   * Estimates remaining processing time
   */
  private static estimateTimeRemaining(data: any): number | undefined {
    if (data.processing_status === 'completed' || data.processing_status === 'failed') {
      return 0
    }

    if (data.processing_started_at) {
      const startTime = new Date(data.processing_started_at).getTime()
      const currentTime = Date.now()
      const elapsedTime = currentTime - startTime
      
      // Estimate based on typical processing times
      // This is a rough estimate - in practice, you'd use more sophisticated algorithms
      const estimatedTotalTime = 120000 // 2 minutes
      const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime)
      
      return Math.round(remainingTime / 1000) // Return seconds
    }

    return undefined
  }

  /**
   * Gets processing statistics for a user
   */
  static async getUserProcessingStats(userId: string): Promise<{
    totalDocuments: number
    completedDocuments: number
    failedDocuments: number
    averageProcessingTime: number
    lastProcessedAt?: Date
  }> {
    const client = this.getClient()

    const { data, error } = await client
      .from('document_analysis')
      .select('processing_status, processing_started_at, processing_completed_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get processing stats: ${error.message}`)
    }

    // Cast data array to any[] to avoid TypeScript errors
    const records = data as any[]
    
    const totalDocuments = records.length
    const completedDocuments = records.filter(d => d.processing_status === 'completed').length
    const failedDocuments = records.filter(d => d.processing_status === 'failed').length

    // Calculate average processing time
    const completedWithTiming = records.filter(d => 
      d.processing_status === 'completed' && 
      d.processing_started_at && 
      d.processing_completed_at
    )

    const averageProcessingTime = completedWithTiming.length > 0
      ? completedWithTiming.reduce((sum, doc) => {
          const start = new Date(doc.processing_started_at).getTime()
          const end = new Date(doc.processing_completed_at).getTime()
          return sum + (end - start)
        }, 0) / completedWithTiming.length
      : 0

    const lastProcessedAt = records.length > 0 && records[0].processing_completed_at
      ? new Date(records[0].processing_completed_at)
      : undefined

    return {
      totalDocuments,
      completedDocuments,
      failedDocuments,
      averageProcessingTime,
      lastProcessedAt
    }
  }

  /**
   * Cleans up old processing records (for maintenance)
   */
  static async cleanupOldRecords(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const client = this.getClient()

    const { data, error } = await client
      .from('document_analysis')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      throw new Error(`Failed to cleanup old records: ${error.message}`)
    }

    return data?.length || 0
  }
}

export default ProgressTracker
