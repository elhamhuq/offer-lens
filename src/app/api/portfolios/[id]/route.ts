import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/lib/supabase'
import type { UpdatePortfolioRequest } from '@/types/portfolio'

/**
 * Schema for portfolio updates
 */
const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  portfolio_data: z.object({}).passthrough().optional(),
  risk_tolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  investment_horizon: z.enum(['short', 'medium', 'long']).optional(),
})

/**
 * GET /api/portfolios/[id]
 * Retrieve a specific portfolio by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const portfolioId = params.id
    
    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
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

    // Fetch portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (error || !portfolio) {
      console.error('❌ Portfolio fetch error:', error)
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Get scenarios associated with this portfolio
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('id, name, job_offer, investments, created_at')
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false })

    if (scenariosError) {
      console.warn('⚠️ Could not fetch associated scenarios:', scenariosError)
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        ...portfolio,
        scenarios: scenarios || [],
        scenario_count: scenarios?.length || 0,
      },
    })

  } catch (error) {
    console.error('❌ Portfolio GET error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve portfolio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/portfolios/[id]
 * Update a specific portfolio
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const portfolioId = params.id
    
    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
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
    const validationResult = updatePortfolioSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid portfolio data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Update portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !portfolio) {
      console.error('❌ Portfolio update error:', error)
      return NextResponse.json(
        { error: 'Portfolio not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      portfolio,
      message: 'Portfolio updated successfully',
    })

  } catch (error) {
    console.error('❌ Portfolio PUT error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update portfolio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/portfolios/[id]
 * Delete a specific portfolio
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const portfolioId = params.id
    
    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
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

    // Check if portfolio exists and belongs to user
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Delete portfolio (this will set portfolio_id to NULL in scenarios due to ON DELETE SET NULL)
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Portfolio deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete portfolio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio deleted successfully',
      portfolio_id: portfolioId,
    })

  } catch (error) {
    console.error('❌ Portfolio DELETE error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete portfolio',
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
