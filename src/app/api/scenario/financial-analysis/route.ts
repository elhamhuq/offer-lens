import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { company, baseSalary, location } = await request.json()

    const supabase = createRouteHandlerClient({ cookies })

    // Query document_analysis table for matching analysis
    const { data: analyses, error } = await supabase
      .from('document_analysis')
      .select('financial_analysis')
      .eq('extracted_data->>company', company)
      .eq('extracted_data->>baseSalary', baseSalary)
      .eq('extracted_data->>location', location)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({ error: 'No matching analysis found' }, { status: 404 })
    }

    return NextResponse.json(analyses[0].financial_analysis)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
