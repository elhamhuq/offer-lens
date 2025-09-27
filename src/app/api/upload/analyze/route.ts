import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { DocumentProcessor } from '@/lib/documentProcessor'
import { DataExtractor } from '@/lib/dataExtractor'
import { EmbeddingService } from '@/lib/embeddings'
import { getGeminiClient } from '@/lib/gemini'
import { apiCallManager } from '@/lib/rateLimiter'
import { ProgressTracker } from '@/lib/simpleProgressTracker'
import { formatFinancialAnalysis } from '@/lib/responseFormatter'
import { conversationManager } from '@/lib/conversationManager'
import { Document } from '@langchain/core/documents'
import type { Database } from '@/lib/supabase'

/**
 * POST /api/upload/analyze
 * Handles PDF upload, text extraction, embedding generation, and initial analysis
 */
export async function POST(request: NextRequest) {
  console.log('📤 Starting file upload and analysis...')
  
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type and size
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate analysis ID
    const analysisId = uuidv4()
    const sessionId = `session_${analysisId}`

    // Initialize progress tracker
    const progressTracker = new ProgressTracker()
    progressTracker.initializeProgress(analysisId, {
      upload: 0,
      extraction: 0,
      embedding: 0,
      analysis: 0,
      storage: 0,
    })

    // Create initial database entry - use existing column names
    const insertData: any = {
      id: analysisId,
      user_id: user.id,
      original_filename: file.name,
      file_size_bytes: file.size,
      processing_status: 'processing',
      processing_started_at: new Date().toISOString(),
    }
    
    // Don't add metadata - column doesn't exist yet
    // We can store metadata later if needed
    
    console.log('Attempting to insert:', insertData)
    
    const { data: analysisRecord, error: dbError } = await supabase
      .from('document_analysis')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create analysis record' },
        { status: 500 }
      )
    }

    // Process file asynchronously
    processFileAsync(
      file,
      analysisId,
      sessionId,
      user.id,
      progressTracker,
      supabase
    ).catch(error => {
      console.error('❌ Async processing error:', error)
      // Update status to failed
      supabase
        .from('document_analysis')
        .update({
          processing_status: 'failed',
          error_message: error.message,
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', analysisId)
        .then(() => {
          progressTracker.updateProgress(analysisId, 'extraction', 100, 'failed')
        })
    })

    // Return immediately with analysis ID for polling
    return NextResponse.json({
      success: true,
      analysisId,
      message: 'File uploaded successfully. Processing in progress.',
      statusUrl: `/api/analysis/${analysisId}/status`,
      resultsUrl: `/api/analysis/${analysisId}/results`,
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Process file asynchronously
 */
async function processFileAsync(
  file: File,
  analysisId: string,
  sessionId: string,
  userId: string,
  progressTracker: ProgressTracker,
  supabase: any
) {
  try {
    // Step 1: Convert file to buffer and extract text
    progressTracker.updateProgress(analysisId, 'upload', 100, 'completed')
    progressTracker.updateProgress(analysisId, 'extraction', 10, 'processing')

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Process the PDF file directly
    const { text, chunks, documents } = await DocumentProcessor.processPDF(
      file,
      {
        userId,
        documentAnalysisId: analysisId
      }
    )
    
    console.log(`📄 Extracted ${text.length} characters in ${chunks.length} chunks`)
    progressTracker.updateProgress(analysisId, 'extraction', 50, 'processing')

    // Step 2: Extract structured data using LangChain
    const extractedData = await apiCallManager.executeAPICall(
      'openai',
      () => DataExtractor.extract(text),
      userId
    )
    
    console.log('✅ Structured data extracted:', extractedData)
    progressTracker.updateProgress(analysisId, 'extraction', 100, 'completed')

    // Step 3: Generate embeddings
    progressTracker.updateProgress(analysisId, 'embedding', 10, 'processing')
    
    // Convert chunks to Document objects for embedding generation
    const embeddingDocuments = chunks.map((chunk: string, index: number) => ({
      pageContent: chunk,
      metadata: { chunkIndex: index }
    }))
    
    const embeddings = await apiCallManager.executeAPICall(
      'embedding',
      () => EmbeddingService.generateEmbeddings(embeddingDocuments as any),
      userId
    ) as number[][]
    
    console.log(`🔢 Generated ${embeddings.length} embeddings`)
    progressTracker.updateProgress(analysisId, 'embedding', 100, 'completed')

    // Step 4: Store embeddings in database
    progressTracker.updateProgress(analysisId, 'storage', 10, 'processing')
    
    const embeddingRecords = embeddings.map((embedding: number[], index: number) => ({
      id: uuidv4(),
      document_analysis_id: analysisId,
      user_id: userId,
      chunk_index: index,
      chunk_text: chunks[index],
      embedding: embedding,
      created_at: new Date().toISOString(),
    }))

    const { error: embeddingError } = await supabase
      .from('job_offer_embeddings')
      .insert(embeddingRecords)

    if (embeddingError) {
      throw new Error(`Failed to store embeddings: ${embeddingError.message}`)
    }
    
    progressTracker.updateProgress(analysisId, 'storage', 50, 'processing')

    // Step 5: Perform initial financial analysis with Gemini
    progressTracker.updateProgress(analysisId, 'analysis', 10, 'processing')
    
    const geminiClient = getGeminiClient()
    const financialAnalysis = await apiCallManager.executeAPICall(
      'gemini',
      () => geminiClient.analyzeJobOffer(extractedData),
      userId
    )
    
    console.log('💰 Financial analysis completed')
    progressTracker.updateProgress(analysisId, 'analysis', 50, 'processing')

    // Initialize conversation context
    conversationManager.initializeContext(sessionId, extractedData, userId, {
      documentId: analysisId,
      companyName: extractedData.company,
      position: extractedData.jobTitle,
      analysisType: 'job_offer',
    })
    conversationManager.updateAnalysis(sessionId, financialAnalysis)

    // Step 6: Update database with results
    const { error: updateError } = await supabase
      .from('document_analysis')
      .update({
        processing_status: 'completed',
        extracted_data: extractedData,
        financial_analysis: financialAnalysis,
        formatted_analysis: formatFinancialAnalysis(financialAnalysis),
        confidence_scores: calculateConfidenceScores(extractedData, chunks),
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    if (updateError) {
      throw new Error(`Failed to update analysis: ${updateError.message}`)
    }

    progressTracker.updateProgress(analysisId, 'analysis', 100, 'completed')
    progressTracker.updateProgress(analysisId, 'storage', 100, 'completed')
    
    console.log('✅ Analysis completed successfully')

  } catch (error) {
    console.error('❌ Processing error:', error)
    
    // Update status to failed
    await supabase
      .from('document_analysis')
      .update({
        processing_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Processing failed',
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    // Update progress to failed
    progressTracker.updateProgress(analysisId, 'analysis', 100, 'failed')
    
    throw error
  }
}

/**
 * Calculate confidence scores for extracted data
 */
function calculateConfidenceScores(
  extractedData: any,
  chunks: string[]
): Record<string, number> {
  const scores: Record<string, number> = {}
  
  // Calculate confidence based on presence in chunks
  const textContent = chunks.join(' ').toLowerCase()
  
  for (const [key, value] of Object.entries(extractedData)) {
    if (value && typeof value === 'string') {
      const valueLower = value.toLowerCase()
      const occurrences = textContent.split(valueLower).length - 1
      scores[key] = Math.min(0.5 + (occurrences * 0.1), 1.0)
    } else if (value && typeof value === 'number') {
      const valueStr = value.toString()
      const occurrences = textContent.split(valueStr).length - 1
      scores[key] = Math.min(0.5 + (occurrences * 0.15), 1.0)
    } else if (Array.isArray(value)) {
      scores[key] = value.length > 0 ? 0.8 : 0
    } else {
      scores[key] = value ? 0.5 : 0
    }
  }
  
  return scores
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
