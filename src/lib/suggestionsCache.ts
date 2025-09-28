// utils/suggestionsCache.ts
interface CachedSuggestion {
  offerId: string
  suggestions: any[]
  timestamp: number
  financialAnalysisHash: string
}

const SUGGESTIONS_CACHE_KEY = 'gemini-investment-suggestions'

// Create a hash of financial analysis to detect changes
function createAnalysisHash(financialAnalysis: any): string {
  const key = JSON.stringify({
    netIncome: financialAnalysis?.monthlyBreakdown?.netIncome,
    savingsPotential: financialAnalysis?.monthlyBreakdown?.savingsPotential,
    estimatedExpenses: financialAnalysis?.monthlyBreakdown?.estimatedExpenses,
  })
  return btoa(key) // Simple base64 hash
}

export const suggestionsCache = {
  // Save suggestions to localStorage with offer ID
  save: (offerId: string, suggestions: any[], financialAnalysis: any) => {
    try {
      const cached = suggestionsCache.loadAll()
      const analysisHash = createAnalysisHash(financialAnalysis)
      
      cached[offerId] = {
        offerId,
        suggestions,
        timestamp: Date.now(),
        financialAnalysisHash: analysisHash
      }
      
      localStorage.setItem(SUGGESTIONS_CACHE_KEY, JSON.stringify(cached))
    } catch (error) {
      console.error('Failed to cache suggestions:', error)
    }
  },

  // Load suggestions for specific offer
  load: (offerId: string, financialAnalysis: any): any[] | null => {
    try {
      const cached = suggestionsCache.loadAll()
      const offerCache = cached[offerId]
      
      if (!offerCache) return null
      
      // Check if analysis has changed (would need new suggestions)
      const currentHash = createAnalysisHash(financialAnalysis)
      if (offerCache.financialAnalysisHash !== currentHash) {
        // Analysis changed, remove old cache
        delete cached[offerId]
        localStorage.setItem(SUGGESTIONS_CACHE_KEY, JSON.stringify(cached))
        return null
      }
      
      return offerCache.suggestions
    } catch (error) {
      console.error('Failed to load cached suggestions:', error)
      return null
    }
  },

  // Load all cached suggestions
  loadAll: (): Record<string, CachedSuggestion> => {
    try {
      const cached = localStorage.getItem(SUGGESTIONS_CACHE_KEY)
      return cached ? JSON.parse(cached) : {}
    } catch (error) {
      console.error('Failed to parse suggestions cache:', error)
      return {}
    }
  },

  // Clear cache for specific offer
  clear: (offerId: string) => {
    try {
      const cached = suggestionsCache.loadAll()
      delete cached[offerId]
      localStorage.setItem(SUGGESTIONS_CACHE_KEY, JSON.stringify(cached))
    } catch (error) {
      console.error('Failed to clear suggestion cache:', error)
    }
  },

  // Clear all cached suggestions
  clearAll: () => {
    try {
      localStorage.removeItem(SUGGESTIONS_CACHE_KEY)
    } catch (error) {
      console.error('Failed to clear all suggestion cache:', error)
    }
  }
}
