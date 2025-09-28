import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Scenario, Investment, FinancialProjection } from '@/types'
import { setCookie, getCookie, deleteCookie, isTokenValid } from '@/lib/cookies'
import { scenariosDb } from '@/lib/database'

interface User {
  id: string
  email: string
  name: string
}

interface StoreState {
  // Authentication
  isAuthenticated: boolean
  user: User | null
  authToken: string | null
  
  // Scenarios
  scenarios: Scenario[]
  currentScenario: Scenario | null
  
  // Investments
  investments: Investment[]
  
  // Financial projections
  mockProjections: FinancialProjection[]
  
  // UI State
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  
  // Actions
  setAuthenticated: (authenticated: boolean) => void
  setUser: (user: User | null) => void
  setAuthToken: (token: string | null) => void
  initializeAuth: () => Promise<void>
  clearAuth: () => void
  loadScenarios: () => Promise<void>
  
  addScenario: (scenario: Scenario) => void
  updateScenario: (id: string, updates: Partial<Scenario>) => void
  deleteScenario: (id: string) => void
  setCurrentScenario: (scenario: Scenario | null) => void
  
  addInvestment: (investment: Investment) => void
  updateInvestment: (id: string, updates: Partial<Investment>) => void
  deleteInvestment: (id: string) => void
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed values
  getTotalMonthlyInvestment: () => number
  getTotalProjectedValue: (years: number) => number
}

// Generate mock financial projections
const generateMockProjections = (): FinancialProjection[] => {
  const projections: FinancialProjection[] = []
  const monthlyInvestment = 1500
  const annualInvestment = monthlyInvestment * 12
  const annualReturn = 0.082 // 8.2%
  
  let totalContributions = 0
  let totalValue = 0
  
  for (let year = 1; year <= 30; year++) {
    totalContributions += annualInvestment
    totalValue = totalContributions + (totalValue * annualReturn)
    const growth = totalValue - totalContributions
    const takeHomePay = 108000 // Mock take-home pay
    
    projections.push({
      year: 2024 + year,
      totalValue: Math.round(totalValue),
      contributions: totalContributions,
      growth: Math.round(growth),
      takeHomePay
    })
  }
  
  return projections
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      authToken: null,
      scenarios: [],
      currentScenario: null,
      investments: [],
      mockProjections: generateMockProjections(),
      isLoading: false,
      error: null,
      isInitialized: false,
      
      // Authentication actions
      setAuthenticated: (authenticated) => {
  const wasAuthenticated = get().isAuthenticated
  set({ isAuthenticated: authenticated })
  
  if (authenticated) {
    // Set cookie for 1 hour when authenticated
    const token = get().authToken
    if (token) {
      setCookie('auth-token', token, 1)
    }
    
    // Load scenarios when user logs in (but not when restoring from cookie)
    if (!wasAuthenticated) {
      console.log('🔄 User just logged in, loading scenarios...')
      get().loadScenarios()
    }
  } else {
    // Clear cookie when not authenticated
    deleteCookie('auth-token')
    // Clear scenarios when logging out
    set({ scenarios: [], currentScenario: null })
  }
},
      setUser: (user) => set({ user }),
      setAuthToken: (token) => {
        set({ authToken: token })
        if (token) {
          setCookie('auth-token', token, 1)
        } else {
          deleteCookie('auth-token')
        }
      },
      initializeAuth: async () => {
        if (typeof window === 'undefined') return
        
        set({ isLoading: true })
        
        try {
          const cookieToken = getCookie('auth-token')
          
          if (cookieToken && isTokenValid(cookieToken)) {
            // Token exists and is valid, restore authentication
            set({ 
              isAuthenticated: true, 
              authToken: cookieToken,
              isInitialized: true 
            })
            // Load scenarios after authentication is restored
            get().loadScenarios()
          } else {
            // No valid token, clear authentication
            deleteCookie('auth-token')
            set({ 
              isAuthenticated: false, 
              user: null, 
              authToken: null,
              isInitialized: true 
            })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ 
            isAuthenticated: false, 
            user: null, 
            authToken: null,
            isInitialized: true 
          })
        } finally {
          set({ isLoading: false })
        }
      },
      clearAuth: () => {
        set({ 
          isAuthenticated: false, 
          user: null, 
          authToken: null,
          scenarios: []
        })
        deleteCookie('auth-token')
      },
      
      loadScenarios: async () => {
  const { user, isAuthenticated } = get()
  if (!isAuthenticated || !user) {
    console.log('❌ Cannot load scenarios: user not authenticated')
    return
  }

  try {
    console.log('🔄 Loading scenarios for user:', user.id)
    const dbScenarios = await scenariosDb.getByUserId(user.id)
    
    // Convert database scenarios to local format
    const scenarios: Scenario[] = dbScenarios.map(dbScenario => ({
      id: dbScenario.id,
      name: dbScenario.name,
      jobOffer: dbScenario.job_offer,
      investments: dbScenario.investments,
      createdAt: new Date(dbScenario.created_at),
      updatedAt: new Date(dbScenario.updated_at),
    }))

    console.log('✅ Loaded scenarios:', scenarios.length)
    set({ scenarios })
  } catch (error) {
    console.error('❌ Error loading scenarios:', error)
    throw error // Re-throw so dashboard can handle it
  }
},

  
  // Scenario actions
  addScenario: (scenario) =>
    set((state) => ({
      scenarios: [...state.scenarios, scenario]
    })),
  
  updateScenario: (id, updates) =>
    set((state) => ({
      scenarios: state.scenarios.map((scenario) =>
        scenario.id === id ? { ...scenario, ...updates, updatedAt: new Date() } : scenario
      )
    })),
  
  deleteScenario: (id) =>
    set((state) => ({
      scenarios: state.scenarios.filter((scenario) => scenario.id !== id),
      currentScenario: state.currentScenario?.id === id ? null : state.currentScenario
    })),
  
  setCurrentScenario: (scenario) =>
    set({ currentScenario: scenario }),
  
  // Investment actions
  addInvestment: (investment) =>
    set((state) => ({
      investments: [...state.investments, investment]
    })),
  
  updateInvestment: (id, updates) =>
    set((state) => ({
      investments: state.investments.map((investment) =>
        investment.id === id ? { ...investment, ...updates } : investment
      )
    })),
  
  deleteInvestment: (id) =>
    set((state) => ({
      investments: state.investments.filter((investment) => investment.id !== id)
    })),
  
  // UI actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Computed values
  getTotalMonthlyInvestment: () => {
    const { investments } = get()
    return investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0)
  },
  
  getTotalProjectedValue: (years) => {
    const { getTotalMonthlyInvestment } = get()
    const monthlyInvestment = getTotalMonthlyInvestment()
    const annualInvestment = monthlyInvestment * 12
    const annualReturn = 0.082
    
    let totalValue = 0
    for (let year = 1; year <= years; year++) {
      totalValue = (totalValue + annualInvestment) * (1 + annualReturn)
    }
    
    return Math.round(totalValue)
  }
}),
{
  name: 'cashflow-compass-store',
  partialize: (state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    authToken: state.authToken,
    scenarios: state.scenarios,
    investments: state.investments,
  }),
}
)
)