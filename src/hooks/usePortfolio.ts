import { useState, useEffect, useCallback } from 'react'
import type { Portfolio, CreatePortfolioRequest, UpdatePortfolioRequest } from '@/types/portfolio'

interface UsePortfolioReturn {
  portfolios: Portfolio[]
  loading: boolean
  error: string | null
  createPortfolio: (data: CreatePortfolioRequest) => Promise<Portfolio | null>
  updatePortfolio: (id: string, data: UpdatePortfolioRequest) => Promise<Portfolio | null>
  deletePortfolio: (id: string) => Promise<boolean>
  getPortfolio: (id: string) => Promise<Portfolio | null>
  refetch: () => Promise<void>
}

export function usePortfolio(): UsePortfolioReturn {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all portfolios
  const fetchPortfolios = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/portfolios')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch portfolios')
      }

      setPortfolios(data.portfolios || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to fetch portfolios:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new portfolio
  const createPortfolio = useCallback(async (data: CreatePortfolioRequest): Promise<Portfolio | null> => {
    setError(null)

    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create portfolio')
      }

      // Add to local state
      setPortfolios(prev => [result.portfolio, ...prev])
      return result.portfolio
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to create portfolio:', err)
      return null
    }
  }, [])

  // Update an existing portfolio
  const updatePortfolio = useCallback(async (id: string, data: UpdatePortfolioRequest): Promise<Portfolio | null> => {
    setError(null)

    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update portfolio')
      }

      // Update local state
      setPortfolios(prev => 
        prev.map(portfolio => 
          portfolio.id === id ? result.portfolio : portfolio
        )
      )
      return result.portfolio
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to update portfolio:', err)
      return null
    }
  }, [])

  // Delete a portfolio
  const deletePortfolio = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete portfolio')
      }

      // Remove from local state
      setPortfolios(prev => prev.filter(portfolio => portfolio.id !== id))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to delete portfolio:', err)
      return false
    }
  }, [])

  // Get a specific portfolio
  const getPortfolio = useCallback(async (id: string): Promise<Portfolio | null> => {
    setError(null)

    try {
      const response = await fetch(`/api/portfolios/${id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch portfolio')
      }

      return result.portfolio
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to fetch portfolio:', err)
      return null
    }
  }, [])

  // Load portfolios on mount
  useEffect(() => {
    fetchPortfolios()
  }, [fetchPortfolios])

  return {
    portfolios,
    loading,
    error,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    getPortfolio,
    refetch: fetchPortfolios,
  }
}
