import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ProgressTracker } from '@/lib/simpleProgressTracker'
import type { Database } from '@/lib/supabase'

/**
 * GET /api/analysis/[id]/status
 * Returns the current processing status and progress of an analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = params.id
    
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch analysis record from database
    const { data: analysis, error: dbError } = await supabase
      .from('document_analysis')
      .select('id, processing_status, created_at, processing_started_at, processing_completed_at, original_filename, error_message')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (dbError || !analysis) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Get progress details from ProgressTracker
    const progressTracker = new ProgressTracker()
    const progress = progressTracker.getProgress(analysisId)

    // Calculate overall progress percentage
    const overallProgress = calculateOverallProgress(progress)

    // Determine if processing is complete
    const isComplete = analysis.processing_status === 'completed'
    const isFailed = analysis.processing_status === 'failed'

    // Build response
    const response = {
      analysisId,
      status: analysis.processing_status,
      filename: analysis.original_filename,
      createdAt: analysis.created_at,
      updatedAt: analysis.processing_completed_at || analysis.processing_started_at,
      progress: {
        overall: overallProgress,
        stages: progress || getDefaultProgress(),
      },
      isComplete,
      isFailed,
      errorMessage: analysis.error_message,
      estimatedTimeRemaining: estimateTimeRemaining(overallProgress, analysis.created_at),
      nextSteps: getNextSteps(analysis.processing_status),
    }

    // Add polling hints
    const headers = new Headers()
    
    if (!isComplete && !isFailed) {
      // Suggest client to poll again in 2 seconds
      headers.set('X-Poll-Interval', '2000')
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    } else {
      // Analysis is complete, cache for a short time
      headers.set('Cache-Control', 'private, max-age=60')
    }

    return NextResponse.json(response, { headers })

  } catch (error) {
    console.error('❌ Status check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check analysis status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate overall progress from stage progress
 */
function calculateOverallProgress(
  progress: Record<string, { percentage: number; status: string }> | null
): number {
  if (!progress) return 0

  const stages = Object.values(progress)
  if (stages.length === 0) return 0

  const totalProgress = stages.reduce((sum, stage) => sum + stage.percentage, 0)
  return Math.round(totalProgress / stages.length)
}

/**
 * Get default progress structure
 */
function getDefaultProgress() {
  return {
    upload: { percentage: 0, status: 'pending' },
    extraction: { percentage: 0, status: 'pending' },
    embedding: { percentage: 0, status: 'pending' },
    analysis: { percentage: 0, status: 'pending' },
    storage: { percentage: 0, status: 'pending' },
  }
}

/**
 * Estimate remaining time based on progress and elapsed time
 */
function estimateTimeRemaining(
  overallProgress: number,
  createdAt: string
): number | null {
  if (overallProgress === 0 || overallProgress === 100) {
    return null
  }

  const elapsed = Date.now() - new Date(createdAt).getTime()
  const estimatedTotal = (elapsed / overallProgress) * 100
  const remaining = estimatedTotal - elapsed

  // Return in seconds, capped at 5 minutes
  return Math.min(Math.round(remaining / 1000), 300)
}

/**
 * Get next steps based on current status
 */
function getNextSteps(status: string): string[] {
  switch (status) {
    case 'processing':
      return [
        'Extracting text from PDF',
        'Generating embeddings',
        'Analyzing with AI',
        'Storing results',
      ]
    case 'completed':
      return [
        'View analysis results',
        'Ask follow-up questions',
        'Compare with other offers',
        'Export report',
      ]
    case 'failed':
      return [
        'Check file format',
        'Retry upload',
        'Contact support if issue persists',
      ]
    default:
      return []
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
