// app/api/analysis/offers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'

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

    // Fetch all completed analyses for the user
    const { data: analyses, error: dbError } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('user_id', user.id)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch job offers' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedOffers = analyses?.map(analysis => ({
      id: analysis.id,
      filename: analysis.filename,
      company: analysis.extracted_data?.company || 'Unknown Company',
      position: analysis.extracted_data?.jobTitle || 'Unknown Position',
      baseSalary: analysis.extracted_data?.baseSalary || 0,
      location: analysis.extracted_data?.location || 'Unknown Location',
      netIncome: analysis.financial_analysis?.monthlyBreakdown?.netIncome || 0,
      savingsPotential: analysis.financial_analysis?.monthlyBreakdown?.savingsPotential || 0,
      createdAt: analysis.created_at,
      extractedData: analysis.extracted_data,
      financialAnalysis: analysis.financial_analysis
    })) || []

    return NextResponse.json({
      offers: formattedOffers,
      count: formattedOffers.length
    })

  } catch (error) {
    console.error('❌ Offers fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch job offers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
