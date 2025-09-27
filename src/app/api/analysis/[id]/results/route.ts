import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { formatFinancialAnalysis, createMarkdownSummary } from '@/lib/responseFormatter'
import { conversationManager } from '@/lib/conversationManager'
import type { Database } from '@/lib/supabase'

/**
 * GET /api/analysis/[id]/results
 * Returns the complete analysis results including extracted data and financial analysis
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

    // Fetch complete analysis record
    const { data: analysis, error: dbError } = await supabase
      .from('document_analysis')
      .select('*')
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

    // Check if analysis is complete
    if (analysis.processing_status !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Analysis not complete',
          status: analysis.processing_status,
          message: analysis.processing_status === 'failed' 
            ? `Analysis failed: ${analysis.error_message}`
            : 'Analysis is still processing. Please check status endpoint.'
        },
        { status: analysis.processing_status === 'failed' ? 500 : 202 }
      )
    }

    // Fetch embeddings associated with the analysis
    const { data: embeddings, error: embeddingError } = await supabase
      .from('job_offer_embeddings')
      .select('chunk_text, chunk_index, embedding')
      .eq('document_analysis_id', analysisId)
      .order('chunk_index', { ascending: true })

    if (embeddingError) {
      console.error('❌ Embedding retrieval error:', embeddingError)
      // Continue without embeddings if retrieval fails
    }

    // Get or create conversation session
    const sessionId = `session_${analysisId}`
    const conversationContext = conversationManager.getContext(sessionId)

    // Format the response
    const response = {
      analysisId,
      filename: analysis.filename,
      createdAt: analysis.created_at,
      completedAt: analysis.updated_at,
      extractedData: analysis.extracted_data,
      confidenceScores: analysis.confidence_scores,
      financialAnalysis: analysis.financial_analysis,
      formattedAnalysis: analysis.formatted_analysis || 
        (analysis.financial_analysis ? formatFinancialAnalysis(analysis.financial_analysis) : null),
      metadata: {
        fileSize: analysis.file_size_bytes,
        embeddingCount: embeddings?.length || 0,
        processingTime: calculateProcessingTime(analysis.created_at, analysis.processing_completed_at),
        ...analysis.metadata,
      },
      conversationSession: {
        sessionId,
        active: !!conversationContext,
        messageCount: conversationContext?.messages.length || 0,
      },
      exportFormats: {
        markdown: `/api/analysis/${analysisId}/export?format=markdown`,
        pdf: `/api/analysis/${analysisId}/export?format=pdf`,
        json: `/api/analysis/${analysisId}/export?format=json`,
      },
      relatedEndpoints: {
        chat: `/api/analysis/${analysisId}/chat`,
        update: `/api/analysis/${analysisId}/extracted-data`,
        compare: `/api/analysis/compare`,
        history: `/api/analysis/history`,
      },
    }

    // Set cache headers for completed analysis
    const headers = new Headers()
    headers.set('Cache-Control', 'private, max-age=300') // Cache for 5 minutes

    return NextResponse.json(response, { headers })

  } catch (error) {
    console.error('❌ Results retrieval error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve analysis results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate processing time in seconds
 */
function calculateProcessingTime(createdAt: string, updatedAt: string): number {
  const start = new Date(createdAt).getTime()
  const end = new Date(updatedAt).getTime()
  return Math.round((end - start) / 1000)
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
