import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  // Do not throw hard errors that break hydration; surface clearer runtime errors instead
  console.error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client for browser-side operations (with RLS)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// NOTE:
// The admin client must NEVER be created in code that can run on the client.
// If you need an admin client, create it in a separate server-only module like:
//   src/lib/supabaseAdmin.ts
// with `import "server-only"` at the top and using `process.env.SUPABASE_SERVICE_ROLE_KEY` there.

// Database types (will be generated from migrations)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      scenarios: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          salary: number
          expenses_json: any
          city: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          salary: number
          expenses_json: any
          city: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          salary?: number
          expenses_json?: any
          city?: string
        }
      }
      runs: {
        Row: {
          id: string
          scenario_id: string
          created_at: string
          weights_json: any
          metrics_json: any
        }
        Insert: {
          id?: string
          scenario_id: string
          created_at?: string
          weights_json: any
          metrics_json: any
        }
        Update: {
          id?: string
          scenario_id?: string
          created_at?: string
          weights_json?: any
          metrics_json?: any
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type-safe client
export const typedSupabase = supabase as any
