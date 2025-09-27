import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getGeminiClient } from '@/lib/gemini'
import { apiCallManager } from '@/lib/rateLimiter'
import { formatFinancialAnalysis } from '@/lib/responseFormatter'
import { conversationManager } from '@/lib/conversationManager'
import type { Database } from '@/lib/supabase'
import type { ExtractedData } from '@/types/analysis'

/**
 * Schema for validating user corrections
 */
const correctionSchema = z.object({
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  baseSalary: z.number().positive().optional(),
  location: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  reportingStructure: z.string().optional(),
  additionalInfo: z.string().optional(),
})

/**
 * PUT /api/analysis/[id]/extracted-data
 * Allows users to correct or update extracted data and triggers re-analysis
 */
export async function PUT(
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
    const validationResult = correctionSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid correction data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const corrections = validationResult.data

    // Fetch existing analysis
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
    if (analysis.status !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Cannot update incomplete analysis',
          status: analysis.status
        },
        { status: 400 }
      )
    }

    // Merge corrections with existing data
    const currentData = analysis.extracted_data as ExtractedData
    const updatedData: ExtractedData = {
      ...currentData,
      ...corrections,
    }

    // Track what was changed
    const changes = trackChanges(currentData, updatedData)
    
    if (changes.length === 0) {
      return NextResponse.json({
        message: 'No changes detected',
        extractedData: currentData,
      })
    }

    // Update extracted data in database
    const { error: updateError } = await supabase
      .from('document_analysis')
      .update({
        extracted_data: updatedData,
        metadata: {
          ...((analysis.metadata as any) || {}),
          lastCorrected: new Date().toISOString(),
          corrections: changes,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('❌ Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update extracted data' },
        { status: 500 }
      )
    }

    // Re-analyze with updated data if significant changes
    let newAnalysis = null
    if (shouldReanalyze(changes)) {
      try {
        const geminiClient = getGeminiClient()
        newAnalysis = await apiCallManager.executeAPICall(
          'gemini',
          () => geminiClient.analyzeJobOffer(updatedData),
          user.id
        )

        // Update financial analysis
        await supabase
          .from('document_analysis')
          .update({
            financial_analysis: newAnalysis,
            formatted_analysis: formatFinancialAnalysis(newAnalysis),
            updated_at: new Date().toISOString(),
          })
          .eq('id', analysisId)

        // Update conversation context
        const sessionId = `session_${analysisId}`
        conversationManager.updateAnalysis(sessionId, newAnalysis)
        
        console.log('✅ Re-analysis completed with updated data')
      } catch (error) {
        console.error('⚠️ Re-analysis failed:', error)
        // Continue without re-analysis
      }
    }

    // Return updated data
    return NextResponse.json({
      success: true,
      message: `Updated ${changes.length} field(s)`,
      changes,
      extractedData: updatedData,
      reanalyzed: !!newAnalysis,
      financialAnalysis: newAnalysis || analysis.financial_analysis,
    })

  } catch (error) {
    console.error('❌ Update error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update extracted data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/analysis/[id]/extracted-data
 * Partial update of extracted data (single field)
 */
export async function PATCH(
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

    // Parse request body
    const body = await request.json()
    const { field, value } = body

    if (!field || value === undefined) {
      return NextResponse.json(
        { error: 'Field and value are required' },
        { status: 400 }
      )
    }

    // Validate field name
    const validFields = [
      'company', 'jobTitle', 'baseSalary', 'location',
      'benefits', 'startDate', 'reportingStructure', 'additionalInfo'
    ]
    
    if (!validFields.includes(field)) {
      return NextResponse.json(
        { error: `Invalid field: ${field}` },
        { status: 400 }
      )
    }

    // Create correction object
    const correction = { [field]: value }
    
    // Use PUT endpoint logic with single field
    const putRequest = new NextRequest(request.url, {
      method: 'PUT',
      headers: request.headers,
      body: JSON.stringify(correction),
    })

    return PUT(putRequest, { params })

  } catch (error) {
    console.error('❌ Patch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to patch extracted data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Track changes between old and new data
 */
function trackChanges(
  oldData: ExtractedData,
  newData: ExtractedData
): Array<{ field: string; oldValue: any; newValue: any }> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = []

  for (const key of Object.keys(newData) as Array<keyof ExtractedData>) {
    const oldValue = oldData[key]
    const newValue = newData[key]

    // Check for changes
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
      })
    }
  }

  return changes
}

/**
 * Determine if changes warrant re-analysis
 */
function shouldReanalyze(changes: Array<{ field: string; oldValue: any; newValue: any }>): boolean {
  // Re-analyze if critical fields changed
  const criticalFields = ['baseSalary', 'location', 'benefits', 'company']
  
  return changes.some(change => criticalFields.includes(change.field))
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
