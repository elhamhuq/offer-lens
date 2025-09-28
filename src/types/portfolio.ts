/**
 * Portfolio-related types for the Offer Lens application
 */

export interface PortfolioData {
  // Investment allocations
  stocks?: {
    percentage: number
    sectors?: {
      technology?: number
      healthcare?: number
      finance?: number
      energy?: number
      consumer?: number
      industrial?: number
      [key: string]: number | undefined
    }
    individual_stocks?: Array<{
      symbol: string
      name: string
      percentage: number
      shares?: number
      cost_basis?: number
    }>
  }
  
  bonds?: {
    percentage: number
    types?: {
      government?: number
      corporate?: number
      municipal?: number
      international?: number
      [key: string]: number | undefined
    }
    individual_bonds?: Array<{
      name: string
      yield: number
      maturity_date?: string
      percentage: number
    }>
  }
  
  real_estate?: {
    percentage: number
    properties?: Array<{
      address: string
      value: number
      monthly_rent?: number
      mortgage_payment?: number
    }>
  }
  
  cash?: {
    percentage: number
    accounts?: Array<{
      type: 'checking' | 'savings' | 'money_market' | 'cd'
      balance: number
      interest_rate?: number
    }>
  }
  
  alternative_investments?: {
    percentage: number
    types?: {
      crypto?: number
      commodities?: number
      private_equity?: number
      hedge_funds?: number
      [key: string]: number | undefined
    }
  }
  
  // Portfolio metadata
  total_value?: number
  target_allocation?: boolean
  rebalancing_frequency?: 'monthly' | 'quarterly' | 'annually' | 'never'
  last_rebalanced?: string
  
  // Performance tracking
  performance?: {
    ytd_return?: number
    one_year_return?: number
    three_year_return?: number
    five_year_return?: number
    sharpe_ratio?: number
    volatility?: number
  }
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
  description?: string
  portfolio_data: PortfolioData
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
  investment_horizon: 'short' | 'medium' | 'long'
  created_at: string
  updated_at: string
}

export interface CreatePortfolioRequest {
  name: string
  description?: string
  portfolio_data: PortfolioData
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive'
  investment_horizon?: 'short' | 'medium' | 'long'
}

export interface UpdatePortfolioRequest {
  name?: string
  description?: string
  portfolio_data?: PortfolioData
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive'
  investment_horizon?: 'short' | 'medium' | 'long'
}

// Portfolio analysis types
export interface PortfolioAnalysis {
  diversification_score: number
  risk_score: number
  expected_return: number
  volatility: number
  sharpe_ratio: number
  recommendations: Array<{
    type: 'rebalance' | 'add' | 'reduce' | 'remove'
    category: string
    current_percentage: number
    recommended_percentage: number
    reasoning: string
  }>
}

// Portfolio comparison types
export interface PortfolioComparison {
  portfolio_a_id: string
  portfolio_b_id: string
  comparison_metrics: {
    risk_return: {
      portfolio_a: { risk: number; return: number }
      portfolio_b: { risk: number; return: number }
    }
    diversification: {
      portfolio_a: number
      portfolio_b: number
    }
    volatility: {
      portfolio_a: number
      portfolio_b: number
    }
  }
  recommendations: string[]
}
