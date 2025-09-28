import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getGeminiClient } from '@/lib/gemini'
import { apiCallManager } from '@/lib/rateLimiter'
import { conversationManager } from '@/lib/conversationManager'
import { formatConversationalResponse } from '@/lib/responseFormatter'
import { EmbeddingService } from '@/lib/embeddings'
import type { Database } from '@/lib/supabase'
import type { ExtractedData } from '@/types/analysis'

/**
 * Schema for chat request
 */
const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    includeAnalysis: z.boolean().default(true),
    includeHistory: z.boolean().default(true),
    maxHistoryMessages: z.number().min(0).max(20).default(10),
  }).optional(),
})

/**
 * POST /api/analysis/[id]/chat
 * Handles conversational follow-up questions about the analysis
 */
export async function POST(
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = chatRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { message, context = { includeAnalysis: true, includeHistory: true, maxHistoryMessages: 10 } } = validationResult.data

    // Fetch analysis data
    const { data: analysis, error: fetchError } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !analysis) {
      console.error('❌ Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Check if analysis is complete
    console.log('🔍 Analysis status check:', {
      id: analysis.id,
      status: analysis.processing_status,
      isCompleted: analysis.processing_status === 'completed'
    })
    
    if (analysis.processing_status !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Analysis not complete',
          message: 'Please wait for the analysis to complete before asking questions.',
          currentStatus: analysis.processing_status
        },
        { status: 400 }
      )
    }

    const extractedData = analysis.extracted_data as ExtractedData
    const financialAnalysis = analysis.financial_analysis

    // Get or create conversation session
    const sessionId = `session_${analysisId}`
    let conversationContext = conversationManager.getContext(sessionId)
    
    if (!conversationContext) {
      // Initialize new conversation
      conversationContext = conversationManager.initializeContext(
        sessionId,
        extractedData,
        user.id,
        {
          documentId: analysisId,
          companyName: extractedData.company,
          position: extractedData.jobTitle,
        }
      )
      
      if (financialAnalysis) {
        conversationManager.updateAnalysis(sessionId, financialAnalysis)
      }
    }

    // Add user message to conversation
    conversationManager.addMessage(sessionId, {
      role: 'user',
      content: message,
      metadata: { type: 'question' },
    })

    // Perform semantic search for relevant context
    let relevantChunks: string[] = []
    if (context.includeAnalysis) {
      try {
        relevantChunks = await searchRelevantChunks(
          supabase,
          analysisId,
          message,
          5 // Top 5 most relevant chunks
        )
        console.log(`📚 Found ${relevantChunks.length} relevant context chunks`)
      } catch (error) {
        console.warn('⚠️ Semantic search failed, continuing without context:', error)
      }
    }

    // Get conversation history
    const conversationSummary = context.includeHistory 
      ? conversationManager.getConversationSummary(sessionId, context.maxHistoryMessages)
      : null

    // Generate response using Gemini
    const geminiClient = getGeminiClient()
    const response = await apiCallManager.executeAPICall(
      'gemini',
      () => geminiClient.answerQuestion(
        message,
        extractedData,
        financialAnalysis,
        conversationSummary?.recentMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        relevantChunks
      ),
      user.id
    )

    // Add assistant response to conversation
    conversationManager.addMessage(sessionId, {
      role: 'assistant',
      content: response.answer,
      metadata: {
        type: 'analysis',
        dataPoints: response.supportingData,
        relatedTopics: conversationSummary?.topics,
      },
    })

    // Format response for UI
    const formattedResponse = formatConversationalResponse(response)

    // Store chat interaction in database
    await supabase
      .from('chat_interactions')
      .insert({
        document_analysis_id: analysisId,
        user_id: user.id,
        message,
        response: response.answer,
        metadata: {
          supportingData: response.supportingData,
          followUpQuestions: response.followUpQuestions,
          relevantChunks: relevantChunks.length,
        },
        created_at: new Date().toISOString(),
      })

    // Return response
    return NextResponse.json({
      success: true,
      response: formattedResponse,
      conversation: {
        sessionId,
        messageCount: conversationContext.messages.length,
        topics: Array.from(conversationContext.topics),
      },
      context: {
        chunksUsed: relevantChunks.length,
        historyIncluded: context.includeHistory,
      },
    })

  } catch (error) {
    console.error('❌ Chat error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/analysis/[id]/chat
 * Retrieves chat history for an analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = params.id
    
    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns the analysis
    const { data: analysis, error: verifyError } = await supabase
      .from('document_analysis')
      .select('id')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (verifyError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Get conversation from memory
    const sessionId = `session_${analysisId}`
    const conversationContext = conversationManager.getContext(sessionId)
    const conversationExport = conversationContext 
      ? conversationManager.exportConversation(sessionId)
      : null

    // Get chat history from database
    const { data: chatHistory, error: historyError } = await supabase
      .from('chat_interactions')
      .select('*')
      .eq('document_analysis_id', analysisId)
      .order('created_at', { ascending: true })

    if (historyError) {
      console.error('❌ History fetch error:', historyError)
    }

    return NextResponse.json({
      analysisId,
      sessionId,
      active: !!conversationContext,
      conversation: conversationExport,
      history: chatHistory || [],
      statistics: conversationContext ? {
        messageCount: conversationContext.messages.length,
        topics: Array.from(conversationContext.topics),
        duration: Date.now() - conversationContext.startTime.getTime(),
      } : null,
    })

  } catch (error) {
    console.error('❌ Chat history error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve chat history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Search for relevant chunks using semantic similarity
 */
async function searchRelevantChunks(
  supabase: any,
  analysisId: string,
  query: string,
  limit: number = 5
): Promise<string[]> {
  // Generate embedding for the query
  // Create a Document object for the query
  const queryDoc = {
    pageContent: query,
    metadata: { type: 'query' }
  }
  const queryEmbeddings = await EmbeddingService.generateEmbeddings([queryDoc as any])
  const queryEmbedding = queryEmbeddings[0]

  // Perform vector similarity search
  const { data: results, error } = await supabase
    .rpc('match_job_offer_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      filter_analysis_id: analysisId,
    })

  if (error) {
    console.error('Vector search error:', error)
    return []
  }

  return results?.map((r: any) => r.chunk_text) || []
}

/**
 * DELETE /api/analysis/[id]/chat
 * Clears chat history for an analysis
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = params.id
    
    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Clear conversation from memory
    const sessionId = `session_${analysisId}`
    const newContext = conversationManager.initializeContext(
      sessionId,
      {} as ExtractedData, // Will be replaced on next chat
      user.id
    )

    // Clear chat history from database
    const { error: deleteError } = await supabase
      .from('chat_interactions')
      .delete()
      .eq('document_analysis_id', analysisId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to clear chat history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared',
      sessionId,
    })

  } catch (error) {
    console.error('❌ Clear chat error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to clear chat history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
