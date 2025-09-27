import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing authentication...')
    
    // Check environment variables
    console.log('Environment check:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing')
    
    // Test Supabase client creation
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Test session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session test:', session ? `✅ User ${session.user.id}` : '❌ No session')
    console.log('Session error:', sessionError)
    
    // Test user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('User test:', userData?.user ? `✅ User ${userData.user.id}` : '❌ No user')
    console.log('User error:', userError)
    
    // Test database connection
    const { data: dbTest, error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    console.log('Database test:', dbError ? `❌ ${dbError.message}` : '✅ Connected')
    
    return NextResponse.json({
      success: true,
      environment: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        openaiKey: !!process.env.OPENAI_API_KEY,
      },
      session: session ? { userId: session.user.id, email: session.user.email } : null,
      user: userData?.user ? { userId: userData.user.id, email: userData.user.email } : null,
      database: !dbError,
      errors: {
        session: sessionError?.message,
        user: userError?.message,
        database: dbError?.message,
      }
    })
  } catch (error: any) {
    console.error('❌ Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

