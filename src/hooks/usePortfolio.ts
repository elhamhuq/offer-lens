import { useState, useEffect } from 'react'
import type { Portfolio, CreatePortfolioRequest, UpdatePortfolioRequest } from '@/types/portfolio'

export const usePortfolio = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load portfolios from API
  const loadPortfolios = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/portfolios')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load portfolios')
      }
      
      setPortfolios(data.portfolios || [])
    } catch (err) {
      console.error('Error loading portfolios:', err)
      setError(err instanceof Error ? err.message : 'Failed to load portfolios')
    } finally {
      setIsLoading(false)
    }
  }

  // Create a new portfolio
  const createPortfolio = async (portfolioData: CreatePortfolioRequest): Promise<Portfolio | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portfolio')
      }
      
      const newPortfolio = data.portfolio
      setPortfolios(prev => [newPortfolio, ...prev])
      setCurrentPortfolio(newPortfolio)
      
      return newPortfolio
    } catch (err) {
      console.error('Error creating portfolio:', err)
      setError(err instanceof Error ? err.message : 'Failed to create portfolio')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Update an existing portfolio
  const updatePortfolio = async (id: string, updates: UpdatePortfolioRequest): Promise<Portfolio | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update portfolio')
      }
      
      const updatedPortfolio = data.portfolio
      setPortfolios(prev => prev.map(p => p.id === id ? updatedPortfolio : p))
      if (currentPortfolio?.id === id) {
        setCurrentPortfolio(updatedPortfolio)
      }
      
      return updatedPortfolio
    } catch (err) {
      console.error('Error updating portfolio:', err)
      setError(err instanceof Error ? err.message : 'Failed to update portfolio')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Delete a portfolio
  const deletePortfolio = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete portfolio')
      }
      
      setPortfolios(prev => prev.filter(p => p.id !== id))
      if (currentPortfolio?.id === id) {
        setCurrentPortfolio(null)
      }
      
      return true
    } catch (err) {
      console.error('Error deleting portfolio:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete portfolio')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Load portfolios on mount
  useEffect(() => {
    loadPortfolios()
  }, [])

  return {
    portfolios,
    currentPortfolio,
    isLoading,
    error,
    loadPortfolios,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    setCurrentPortfolio,
  }
}