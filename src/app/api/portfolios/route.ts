import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/lib/supabase'
import type { CreatePortfolioRequest, UpdatePortfolioRequest } from '@/types/portfolio'

/**
 * Schema for portfolio creation
 */
const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  portfolio_data: z.object({}).passthrough(), // Allow any JSON structure
  risk_tolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  investment_horizon: z.enum(['short', 'medium', 'long']).optional(),
})

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
 * GET /api/portfolios
 * Retrieve user's portfolios with optional filtering
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
    const riskTolerance = searchParams.get('risk_tolerance')
    const investmentHorizon = searchParams.get('investment_horizon')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Build query
    let query = supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (riskTolerance) {
      query = query.eq('risk_tolerance', riskTolerance)
    }

    if (investmentHorizon) {
      query = query.eq('investment_horizon', investmentHorizon)
    }

    const { data: portfolios, error } = await query

    if (error) {
      console.error('❌ Portfolio fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch portfolios' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      portfolios: portfolios || [],
      count: portfolios?.length || 0,
    })

  } catch (error) {
    console.error('❌ Portfolio GET error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve portfolios',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/portfolios
 * Create a new portfolio
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createPortfolioSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid portfolio data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const portfolioData = validationResult.data

    // Create portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        name: portfolioData.name,
        description: portfolioData.description,
        portfolio_data: portfolioData.portfolio_data,
        risk_tolerance: portfolioData.risk_tolerance || 'moderate',
        investment_horizon: portfolioData.investment_horizon || 'medium',
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Portfolio creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create portfolio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      portfolio,
      message: 'Portfolio created successfully',
    })

  } catch (error) {
    console.error('❌ Portfolio POST error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create portfolio',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
