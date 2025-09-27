import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database as DB } from './database.types'

// Re-export the Database type for convenience
export type { Database } from './database.types'

// Define a function to create a Supabase client for client-side use
export const createSupabaseBrowserClient = () =>
  createClientComponentClient<DB>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  })

// Export a singleton instance of the client
export const supabase = createSupabaseBrowserClient()
