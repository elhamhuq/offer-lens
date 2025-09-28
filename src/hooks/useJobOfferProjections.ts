"use client"

// hooks/useJobOfferProjections.ts
import { useState, useEffect, useCallback, useRef } from "react"
import { useStore } from "@/store/useStore"
import { generateInvestmentSuggestions, type InvestmentSuggestion } from "@/lib/investmentSuggestions"

interface JobOffer {
  id: string
  filename: string
  company: string
  position: string
  baseSalary: number
  location: string
  netIncome: number
  savingsPotential: number
  createdAt: string
  extractedData: any
  financialAnalysis: any
}

interface ProjectionPoint {
  year: number
  contributions: number
  growth: number
  totalValue: number
}

interface InvestmentAssumptions {
  monthlyInvestment: number
  annualReturn: number
  salaryGrowthRate: number
}

// Cache outside component to persist across re-renders/re-mounts
const cache = {
  jobOffers: null as JobOffer[] | null,
  selectedOffer: null as JobOffer | null,
  projections: null as ProjectionPoint[] | null,
  assumptions: null as InvestmentAssumptions | null,
  lastFetch: null as number | null,
  suggestions: {} as Record<string, InvestmentSuggestion[]>, // Cache by offer ID
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useJobOfferProjections() {
  const { user } = useStore()
  const [jobOffers, setJobOffers] = useState<JobOffer[]>(cache.jobOffers || [])
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(cache.selectedOffer)
  const [projections, setProjections] = useState<ProjectionPoint[]>(cache.projections || [])
  const [assumptions, setAssumptions] = useState<InvestmentAssumptions>(
    cache.assumptions || {
      monthlyInvestment: 1500,
      annualReturn: 0.082,
      salaryGrowthRate: 0.03,
    },
  )
  const [suggestions, setSuggestions] = useState<InvestmentSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  // Check if cache is still valid
  const isCacheValid = () => {
    return cache.lastFetch && Date.now() - cache.lastFetch < CACHE_DURATION
  }

  // Load suggestions for a specific offer
  const loadSuggestions = useCallback(async (offer: JobOffer) => {
    if (!offer?.financialAnalysis) return

    // Check if we already have cached suggestions for this offer
    if (cache.suggestions[offer.id]) {
      setSuggestions(cache.suggestions[offer.id])
      return
    }

    setLoadingSuggestions(true)
    try {
      const aiSuggestions = await generateInvestmentSuggestions(offer.financialAnalysis, offer.id)
      setSuggestions(aiSuggestions)
      // Cache in memory for faster access
      cache.suggestions[offer.id] = aiSuggestions
    } catch (err) {
      console.error("Failed to load suggestions:", err)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  // Fetch user's job offers with caching
  const fetchJobOffers = useCallback(
    async (forceRefresh = false) => {
      if (!user) return

      // Use cache if valid and not forcing refresh
      if (!forceRefresh && isCacheValid() && cache.jobOffers) {
        setJobOffers(cache.jobOffers)
        if (cache.selectedOffer) {
          setSelectedOffer(cache.selectedOffer)
          // Load suggestions for cached selected offer
          loadSuggestions(cache.selectedOffer)
        }
        setError(null)
        return
      }

      try {
        setLoading(true)
        const response = await fetch("/api/analysis/offers")

        if (!response.ok) {
          if (response.status === 404) {
            const errorMsg = "No job offers found. Upload and analyze job offers to see projections."
            setError(errorMsg)
            setJobOffers([])
            // Update cache
            cache.jobOffers = []
            cache.lastFetch = Date.now()
            return
          }
          throw new Error("Failed to fetch job offers")
        }

        const data = await response.json()
        setJobOffers(data.offers)

        // Update cache
        cache.jobOffers = data.offers
        cache.lastFetch = Date.now()

        // Auto-select the most recent offer if none selected
        if (data.offers.length > 0 && !selectedOffer) {
          const mostRecent = data.offers[0]
          setSelectedOffer(mostRecent)
          cache.selectedOffer = mostRecent

          // Load suggestions for the selected offer
          loadSuggestions(mostRecent)

          // Set default investment amount based on savings potential
          if (mostRecent.savingsPotential > 0) {
            const newAssumptions = {
              ...assumptions,
              monthlyInvestment: Math.round(mostRecent.savingsPotential * 0.6),
            }
            setAssumptions(newAssumptions)
            cache.assumptions = newAssumptions
          }
        }

        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job offers")
        setJobOffers([])
      } finally {
        setLoading(false)
      }
    },
    [user, selectedOffer, assumptions, loadSuggestions],
  )

  // Calculate projections with memoization
  const calculateProjections = useCallback(
    (years: number): ProjectionPoint[] => {
      if (!selectedOffer) return []

      const projections: ProjectionPoint[] = []
      const { monthlyInvestment, annualReturn, salaryGrowthRate } = assumptions

      let totalContributions = 0
      let portfolioValue = 0
      let currentMonthlyInvestment = monthlyInvestment

      for (let year = 1; year <= years; year++) {
        const annualContribution = currentMonthlyInvestment * 12
        totalContributions += annualContribution
        portfolioValue = (portfolioValue + annualContribution) * (1 + annualReturn)
        const growth = portfolioValue - totalContributions

        projections.push({
          year: new Date().getFullYear() + year,
          contributions: Math.round(totalContributions),
          growth: Math.round(growth),
          totalValue: Math.round(portfolioValue),
        })

        currentMonthlyInvestment *= 1 + salaryGrowthRate
      }

      return projections
    },
    [selectedOffer, assumptions],
  )

  // Update projections when dependencies change
  useEffect(() => {
    if (selectedOffer) {
      const newProjections = calculateProjections(30)
      setProjections(newProjections)
      cache.projections = newProjections
    }
  }, [selectedOffer, assumptions, calculateProjections])

  // Initial fetch only once
  useEffect(() => {
    if (!hasFetched.current) {
      fetchJobOffers()
      hasFetched.current = true
    }
  }, [fetchJobOffers])

  // Handle offer selection with caching
  const selectOffer = (offer: JobOffer) => {
    setSelectedOffer(offer)
    cache.selectedOffer = offer

    // Load suggestions for the new offer
    loadSuggestions(offer)

    // Update investment assumptions based on the new offer
    if (offer.savingsPotential > 0) {
      const newAssumptions = {
        ...assumptions,
        monthlyInvestment: Math.round(offer.savingsPotential * 0.6),
      }
      setAssumptions(newAssumptions)
      cache.assumptions = newAssumptions
    }
  }

  // Update assumptions with caching
  const updateAssumptions = (newAssumptions: InvestmentAssumptions) => {
    setAssumptions(newAssumptions)
    cache.assumptions = newAssumptions
  }

  return {
    jobOffers,
    selectedOffer,
    selectOffer,
    projections,
    assumptions,
    setAssumptions: updateAssumptions,
    suggestions,
    loadingSuggestions,
    loading,
    error,
    hasOffers: jobOffers.length > 0,
    refreshOffers: () => fetchJobOffers(true), // Force refresh
    refreshSuggestions: () => selectedOffer && loadSuggestions(selectedOffer),
    isCached: isCacheValid(),
  }
}
