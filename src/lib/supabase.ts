import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for browser-side operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
export const typedSupabaseAdmin = supabaseAdmin as any
