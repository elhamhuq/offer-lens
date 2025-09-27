import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'

/**
 * GET /api/analysis/history
 * Returns the user's analysis history with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const status = searchParams.get('status') // completed, failed, processing
    const search = searchParams.get('search') // Search in filename or company
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build query
    let query = supabase
      .from('document_analysis')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply filters
    if (status) {
      query = query.eq('processing_status', status)
    }

    if (search) {
      // Search in filename and extracted company name
      query = query.or(`original_filename.ilike.%${search}%,extracted_data->company.ilike.%${search}%`)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'processing_completed_at', 'original_filename', 'file_size_bytes']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: analyses, error: queryError, count } = await query

    if (queryError) {
      console.error('❌ Query error:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch analysis history' },
        { status: 500 }
      )
    }

    // Format response data
    const formattedAnalyses = analyses?.map(analysis => ({
      id: analysis.id,
      filename: analysis.filename,
      fileSize: analysis.file_size,
      status: analysis.status,
      createdAt: analysis.created_at,
      updatedAt: analysis.updated_at,
      company: analysis.extracted_data?.company || 'Unknown',
      position: analysis.extracted_data?.jobTitle || 'Unknown',
      salary: analysis.extracted_data?.baseSalary || 0,
      location: analysis.extracted_data?.location || 'Unknown',
      hasFinancialAnalysis: !!analysis.financial_analysis,
      errorMessage: analysis.error_message,
      processingTime: calculateProcessingTime(analysis.created_at, analysis.updated_at),
      endpoints: {
        status: `/api/analysis/${analysis.id}/status`,
        results: `/api/analysis/${analysis.id}/results`,
        chat: `/api/analysis/${analysis.id}/chat`,
        update: `/api/analysis/${analysis.id}/extracted-data`,
      },
    })) || []

    // Calculate statistics
    const statistics = calculateStatistics(analyses || [])

    // Build pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Return response
    return NextResponse.json({
      analyses: formattedAnalyses,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : null,
        prevPage: hasPrev ? page - 1 : null,
      },
      filters: {
        status,
        search,
        dateFrom,
        dateTo,
        sortBy: sortField,
        sortOrder,
      },
      statistics,
    })

  } catch (error) {
    console.error('❌ History error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve analysis history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/analysis/history
 * Bulk delete analyses
 */
export async function DELETE(request: NextRequest) {
  try {
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
    const { analysisIds, deleteAll } = body

    if (!deleteAll && (!analysisIds || !Array.isArray(analysisIds))) {
      return NextResponse.json(
        { error: 'Analysis IDs are required or deleteAll must be true' },
        { status: 400 }
      )
    }

    // Build delete query
    let deleteQuery = supabase
      .from('document_analysis')
      .delete()
      .eq('user_id', user.id)

    if (!deleteAll) {
      deleteQuery = deleteQuery.in('id', analysisIds)
    }

    // Execute delete
    const { error: deleteError, count } = await deleteQuery.select('id')

    if (deleteError) {
      console.error('❌ Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete analyses' },
        { status: 500 }
      )
    }

    // Also delete related embeddings
    let embeddingQuery = supabase
      .from('job_offer_embeddings')
      .delete()
      .eq('user_id', user.id)

    if (!deleteAll) {
      embeddingQuery = embeddingQuery.in('document_analysis_id', analysisIds)
    }

    await embeddingQuery

    return NextResponse.json({
      success: true,
      message: `Deleted ${count} analysis record(s)`,
      deletedCount: count,
    })

  } catch (error) {
    console.error('❌ Delete error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete analyses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate processing time
 */
function calculateProcessingTime(createdAt: string, updatedAt: string): number {
  const start = new Date(createdAt).getTime()
  const end = new Date(updatedAt).getTime()
  return Math.round((end - start) / 1000)
}

/**
 * Calculate statistics from analyses
 */
function calculateStatistics(analyses: any[]): {
  totalAnalyses: number
  completedAnalyses: number
  failedAnalyses: number
  averageProcessingTime: number
  totalFileSize: number
  companies: string[]
  salaryRange: { min: number; max: number; average: number }
  locations: string[]
} {
  const completed = analyses.filter(a => a.status === 'completed')
  const failed = analyses.filter(a => a.status === 'failed')
  
  const processingTimes = completed
    .map(a => calculateProcessingTime(a.created_at, a.updated_at))
    .filter(t => t > 0)
  
  const avgProcessingTime = processingTimes.length > 0
    ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
    : 0

  const totalFileSize = analyses.reduce((sum, a) => sum + (a.file_size || 0), 0)

  const companies = Array.from(new Set(
    completed
      .map(a => a.extracted_data?.company)
      .filter(Boolean)
  ))

  const salaries = completed
    .map(a => a.extracted_data?.baseSalary)
    .filter(s => s && s > 0)

  const salaryRange = {
    min: salaries.length > 0 ? Math.min(...salaries) : 0,
    max: salaries.length > 0 ? Math.max(...salaries) : 0,
    average: salaries.length > 0 
      ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length 
      : 0,
  }

  const locations = Array.from(new Set(
    completed
      .map(a => a.extracted_data?.location)
      .filter(Boolean)
  ))

  return {
    totalAnalyses: analyses.length,
    completedAnalyses: completed.length,
    failedAnalyses: failed.length,
    averageProcessingTime: Math.round(avgProcessingTime),
    totalFileSize,
    companies,
    salaryRange,
    locations,
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
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
