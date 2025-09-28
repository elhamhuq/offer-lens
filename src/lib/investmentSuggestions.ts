// utils/investmentSuggestions.ts
import { suggestionsCache } from './suggestionsCache'

export interface InvestmentSuggestion {
  investmentRate: number
  monthlyAmount: number
  reasoning: string
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive'
}

export async function generateInvestmentSuggestions(
  financialAnalysis: any,
  offerId: string
): Promise<InvestmentSuggestion[]> {
  // Try to load from cache first
  const cachedSuggestions = suggestionsCache.load(offerId, financialAnalysis)
  if (cachedSuggestions) {
    console.log('Using cached Gemini suggestions for offer:', offerId)
    return cachedSuggestions
  }

  try {
    console.log('Fetching new Gemini suggestions for offer:', offerId)
    const response = await fetch('/api/gemini/investment-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ financialAnalysis })
    })

    if (!response.ok) {
      throw new Error('Failed to generate suggestions')
    }

    const suggestions = await response.json()
    
    // Cache the suggestions
    suggestionsCache.save(offerId, suggestions, financialAnalysis)
    
    return suggestions
  } catch (error) {
    console.error('Investment suggestions error:', error)
    // Return default suggestions as fallback
    const fallbackSuggestions = getDefaultSuggestions(financialAnalysis)
    
    // Cache fallback suggestions too
    suggestionsCache.save(offerId, fallbackSuggestions, financialAnalysis)
    
    return fallbackSuggestions
  }
}

function getDefaultSuggestions(financialAnalysis: any): InvestmentSuggestion[] {
  const savingsPotential = financialAnalysis?.monthlyBreakdown?.savingsPotential || 2000

  return [
    {
      investmentRate: 0.15,
      monthlyAmount: Math.round(savingsPotential * 0.5),
      reasoning: "Conservative approach - invest 50% of savings potential to maintain financial flexibility while building wealth.",
      riskLevel: 'Conservative'
    },
    {
      investmentRate: 0.20,
      monthlyAmount: Math.round(savingsPotential * 0.7),
      reasoning: "Balanced approach - invest 70% of savings potential for steady growth with moderate risk.",
      riskLevel: 'Moderate'
    },
    {
      investmentRate: 0.25,
      monthlyAmount: Math.round(savingsPotential * 0.85),
      reasoning: "Aggressive approach - invest 85% of savings potential to maximize long-term wealth accumulation.",
      riskLevel: 'Aggressive'
    }
  ]
}
