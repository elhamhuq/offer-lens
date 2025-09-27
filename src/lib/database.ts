import { supabase, supabaseAdmin, Database } from './supabase'

// Type definitions
type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

type Scenario = Database['public']['Tables']['scenarios']['Row']
type ScenarioInsert = Database['public']['Tables']['scenarios']['Insert']
type ScenarioUpdate = Database['public']['Tables']['scenarios']['Update']

type Run = Database['public']['Tables']['runs']['Row']
type RunInsert = Database['public']['Tables']['runs']['Insert']
type RunUpdate = Database['public']['Tables']['runs']['Update']

// User CRUD operations
export const userDb = {
  // Create a new user
  async create(userData: UserInsert): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return data
  },

  // Get user by ID
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  },

  // Get user by email
  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching user by email:', error)
      return null
    }

    return data
  },

  // Update user
  async update(id: string, updates: UserUpdate): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    return data
  },

  // Delete user
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return false
    }

    return true
  }
}

// Scenario CRUD operations
export const scenarioDb = {
  // Create a new scenario
  async create(scenarioData: ScenarioInsert): Promise<Scenario | null> {
    const { data, error } = await supabase
      .from('scenarios')
      .insert(scenarioData)
      .select()
      .single()

    if (error) {
      console.error('Error creating scenario:', error)
      return null
    }

    return data
  },

  // Get scenario by ID
  async getById(id: string): Promise<Scenario | null> {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching scenario:', error)
      return null
    }

    return data
  },

  // Get all scenarios for a user
  async getByUserId(userId: string): Promise<Scenario[]> {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user scenarios:', error)
      return []
    }

    return data || []
  },

  // Update scenario
  async update(id: string, updates: ScenarioUpdate): Promise<Scenario | null> {
    const { data, error } = await supabase
      .from('scenarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating scenario:', error)
      return null
    }

    return data
  },

  // Delete scenario
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting scenario:', error)
      return false
    }

    return true
  }
}

// Run CRUD operations
export const runDb = {
  // Create a new run
  async create(runData: RunInsert): Promise<Run | null> {
    const { data, error } = await supabase
      .from('runs')
      .insert(runData)
      .select()
      .single()

    if (error) {
      console.error('Error creating run:', error)
      return null
    }

    return data
  },

  // Get run by ID
  async getById(id: string): Promise<Run | null> {
    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching run:', error)
      return null
    }

    return data
  },

  // Get all runs for a scenario
  async getByScenarioId(scenarioId: string): Promise<Run[]> {
    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching scenario runs:', error)
      return []
    }

    return data || []
  },

  // Update run
  async update(id: string, updates: RunUpdate): Promise<Run | null> {
    const { data, error } = await supabase
      .from('runs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating run:', error)
      return null
    }

    return data
  },

  // Delete run
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('runs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting run:', error)
      return false
    }

    return true
  }
}

// Admin operations (bypass RLS)
export const adminDb = {
  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all users:', error)
      return []
    }

    return data || []
  },

  // Get all scenarios (admin only)
  async getAllScenarios(): Promise<Scenario[]> {
    const { data, error } = await supabaseAdmin
      .from('scenarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all scenarios:', error)
      return []
    }

    return data || []
  },

  // Get all runs (admin only)
  async getAllRuns(): Promise<Run[]> {
    const { data, error } = await supabaseAdmin
      .from('runs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all runs:', error)
      return []
    }

    return data || []
  }
}

// Helper function to get current user from session
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  return userDb.getByEmail(user.email!)
}
