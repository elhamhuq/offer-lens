import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { DocumentProcessor } from '@/lib/documentProcessor'
import { EmbeddingService } from '@/lib/embeddings'
import { ProgressTracker } from '@/lib/progressTracker'
import type { Database } from '@/lib/supabase'
import type { ExtractedData, ConfidenceScores } from '@/types/analysis'
import { DataExtractor } from '@/lib/dataExtractor'

// Task 2.0-only endpoint: validate, parse PDF, chunk text. No DB, no embeddings.
export async function POST(request: NextRequest) {
  try {
    console.log('📄 Starting PDF analysis...')

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('❌ No file provided')
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    // Validate the file
    const validationError = DocumentProcessor.validateFile(file)
    if (validationError) {
      console.error(`❌ File validation error: ${validationError}`)
      return NextResponse.json({
        success: false,
        error: validationError
      }, { status: 400 })
    }

    console.log(`📄 Processing file: ${file.name} (${file.size} bytes)`)

    try {
      // Create authenticated Supabase client and ensure user session
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error details:', sessionError)
        throw new Error(`Session error: ${sessionError.message}`)
      }
      
      if (!session?.user?.id) {
        console.error('❌ No authenticated user found in API route')
        return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized - No valid session or user found' 
        }, { status: 401 })
      }
      
      const userId = session.user.id
      console.log('✅ Using userId:', userId)

      // Create document_analysis row
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('document_analysis')
        .insert({
          user_id: userId,
          original_filename: file.name,
          file_size_bytes: file.size,
          processing_status: 'processing',
          processing_started_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (analysisError || !analysisRecord) {
        throw new Error(`Failed to create analysis record: ${analysisError?.message || 'Unknown'}`)
      }
      const documentAnalysisId = analysisRecord.id
      ProgressTracker.setClient(supabase)
      const onProgress = ProgressTracker.createProgressCallback(documentAnalysisId)
      // Extract text from PDF
      await onProgress({ stage: 'parsing', progress: 10, message: 'Extracting text from PDF...' })
      const extractedText = await DocumentProcessor.extractTextFromPDF(file)
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Failed to extract text from PDF')
      }
      console.log(`📝 Extracted ${extractedText.length} characters of text`)

      // Chunk text
      await onProgress({ stage: 'chunking', progress: 30, message: 'Chunking text...' })
      const chunks = DocumentProcessor.chunkTextIntoSentences(extractedText)
      console.log(`📦 Created ${chunks.length} text chunks`)

      // Create documents metadata
      const documents = DocumentProcessor.createDocumentsFromChunks(chunks, {
        filename: file.name,
        userId,
        documentAnalysisId,
        fileSize: file.size,
        extractedAt: new Date().toISOString()
      })

      // Generate and store embeddings
      await onProgress({ stage: 'embedding', progress: 50, message: 'Generating embeddings...' })
      const embeddings = await EmbeddingService.generateEmbeddings(documents)
      await onProgress({ stage: 'embedding', progress: 70, message: 'Storing embeddings...' })
      await EmbeddingService.storeEmbeddings(documentAnalysisId, documents, embeddings, undefined, supabase)

      // Extract structured data
      await onProgress({ stage: 'extracting', progress: 80, message: 'Extracting structured data...' })
      const extractedData = await DataExtractor.extract(extractedText)
      console.log('📋 Extracted structured data:', extractedData)

      // Calculate confidence scores
      await onProgress({ stage: 'analyzing', progress: 90, message: 'Calculating confidence scores...' })
      const confidenceScores = calculateConfidenceScores(extractedData, extractedText)
      console.log('🎯 Calculated confidence scores:', confidenceScores)

      // Mark analysis record completed
      const { error: updateError } = await supabase
        .from('document_analysis')
        .update({
          processing_status: 'completed',
          extracted_data: extractedData,
          confidence_scores: confidenceScores,
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', documentAnalysisId)
      if (updateError) {
        throw new Error(`Failed to update analysis record: ${updateError.message}`)
      }

      await onProgress({ stage: 'completed', progress: 100, message: 'Analysis complete!' })

      return NextResponse.json({
        success: true,
        documentAnalysisId,
        extractedData,
        confidenceScores,
      })

    } catch (processingError: any) {
      console.error('❌ PDF processing error:', processingError)

      return NextResponse.json({
        success: false,
        error: `PDF processing error: ${processingError.message || 'Unknown error'}`
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Unhandled error:', error)
    return NextResponse.json({
      success: false,
      error: `Unhandled error: ${error.message || 'Unknown error'}`
    }, { status: 500 })
  }
}

/**
 * Calculate confidence scores for extracted data
 */
function calculateConfidenceScores(data: ExtractedData, originalText: string): ConfidenceScores {
  const scores: ConfidenceScores = {
    company: 0,
    jobTitle: 0,
    baseSalary: 0,
    location: 0,
    benefits: 0,
    startDate: 0,
    reportingStructure: 0,
    additionalInfo: 0
  }

  // Company confidence
  if (data.company && data.company.length > 1) {
    // Check if company name appears in the text multiple times
    const companyRegex = new RegExp(data.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const companyMatches = (originalText.match(companyRegex) || []).length
    scores.company = Math.min(companyMatches > 2 ? 0.9 : 0.7, 1)
  } else {
    scores.company = 0.3
  }

  // Job title confidence
  if (data.jobTitle && data.jobTitle.length > 3) {
    // Check if job title contains common tech job keywords
    const techJobKeywords = /developer|engineer|manager|analyst|designer|architect|lead/i
    scores.jobTitle = techJobKeywords.test(data.jobTitle) ? 0.85 : 0.6
  } else {
    scores.jobTitle = 0.3
  }

  // Salary confidence
  if (data.baseSalary > 10000) {
    // Check if the salary is within a reasonable range
    const reasonableSalary = data.baseSalary >= 30000 && data.baseSalary <= 500000
    scores.baseSalary = reasonableSalary ? 0.8 : 0.4
  } else {
    scores.baseSalary = 0.3
  }

  // Location confidence
  if (data.location && data.location.length > 3) {
    // Check if location follows a City, State format
    const cityStateFormat = /[A-Za-z\s]+,\s*[A-Za-z]{2}/i
    scores.location = cityStateFormat.test(data.location) ? 0.9 : 0.7
  } else {
    scores.location = 0.3
  }

  // Benefits confidence
  if (data.benefits && data.benefits.length > 0) {
    // More benefits usually means higher confidence
    scores.benefits = Math.min(data.benefits.length * 0.15, 0.9)
  } else {
    scores.benefits = 0.3
  }

  // Calculate confidence for each field (no overall score in our type)

  return scores
}
