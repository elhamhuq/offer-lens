import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/lib/supabase'

/**
 * Schema for scenario updates
 */
const updateScenarioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  job_offer: z.object({}).passthrough().optional(),
  investments: z.array(z.object({})).optional(),
  portfolio_id: z.string().uuid().optional(),
})

/**
 * GET /api/scenarios/[id]
 * Retrieve a specific scenario by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: scenario, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ Scenario fetch error:', error)
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      scenario,
    })

  } catch (error) {
    console.error('❌ Scenario GET error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve scenario',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/scenarios/[id]
 * Update an existing scenario
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validationResult = updateScenarioSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid scenario data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Update scenario
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Scenario update error:', error)
      return NextResponse.json(
        { error: 'Failed to update scenario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scenario,
      message: 'Scenario updated successfully',
    })

  } catch (error) {
    console.error('❌ Scenario PUT error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update scenario',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/scenarios/[id]
 * Delete a scenario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete scenario
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Scenario deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete scenario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Scenario deleted successfully',
    })

  } catch (error) {
    console.error('❌ Scenario DELETE error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete scenario',
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
