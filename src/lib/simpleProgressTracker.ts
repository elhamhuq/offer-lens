/**
 * Simple in-memory progress tracker for document processing
 * This is a lightweight alternative to the database-backed ProgressTracker
 */

export class SimpleProgressTracker {
  private progressData: Map<string, Record<string, { percentage: number; status: string }>> = new Map()

  /**
   * Initialize progress for a new analysis
   */
  initializeProgress(analysisId: string, stages: Record<string, number>): void {
    const progress: Record<string, { percentage: number; status: string }> = {}
    
    for (const stage of Object.keys(stages)) {
      progress[stage] = { percentage: stages[stage], status: 'pending' }
    }
    
    this.progressData.set(analysisId, progress)
  }

  /**
   * Update progress for a specific stage
   */
  updateProgress(
    analysisId: string, 
    stage: string, 
    percentage: number, 
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): void {
    const progress = this.progressData.get(analysisId)
    
    if (progress) {
      progress[stage] = { percentage, status }
      this.progressData.set(analysisId, progress)
    }
  }

  /**
   * Get progress for an analysis
   */
  getProgress(analysisId: string): Record<string, { percentage: number; status: string }> | null {
    return this.progressData.get(analysisId) || null
  }

  /**
   * Clear progress data for an analysis
   */
  clearProgress(analysisId: string): void {
    this.progressData.delete(analysisId)
  }

  /**
   * Get all active progress tracking
   */
  getAllProgress(): Map<string, Record<string, { percentage: number; status: string }>> {
    return this.progressData
  }
}

// Export singleton instance for shared state
export const progressTracker = new SimpleProgressTracker()

// Also export the class for testing or multiple instances
export { SimpleProgressTracker as ProgressTracker }
