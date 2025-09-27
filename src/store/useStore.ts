import { create } from 'zustand'
import type { Scenario, Investment, FinancialProjection } from '@/types'

interface User {
  id: string
  email: string
  name: string
}

interface StoreState {
  // Authentication
  isAuthenticated: boolean
  user: User | null
  
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
  
  // Actions
  setAuthenticated: (authenticated: boolean) => void
  setUser: (user: User | null) => void
  
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

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  scenarios: [],
  currentScenario: null,
  investments: [],
  mockProjections: generateMockProjections(),
  isLoading: false,
  error: null,
  
  // Authentication actions
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setUser: (user) => set({ user }),
  
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
}))