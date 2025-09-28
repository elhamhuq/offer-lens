import { create } from "zustand"

interface Projection {
  year: number
  contributions: number
  growth: number
  totalValue: number
}

interface StoreState {
  mockProjections: Projection[]
}

// Generate mock financial projections for 30 years
const generateMockProjections = (): Projection[] => {
  const projections: Projection[] = []
  const monthlyContribution = 1500
  const annualReturn = 0.082 // 8.2% annual return

  let totalContributions = 0
  let totalValue = 0

  for (let year = 1; year <= 30; year++) {
    totalContributions += monthlyContribution * 12

    // Calculate compound growth
    const previousValue = year === 1 ? 0 : projections[year - 2].totalValue
    const newContributions = monthlyContribution * 12
    const growthOnPrevious = previousValue * annualReturn
    const growthOnNew = (newContributions / 2) * annualReturn // Assume contributions spread throughout year

    totalValue = previousValue + newContributions + growthOnPrevious + growthOnNew
    const totalGrowth = totalValue - totalContributions

    projections.push({
      year: 2024 + year,
      contributions: Math.round(totalContributions),
      growth: Math.round(totalGrowth),
      totalValue: Math.round(totalValue),
    })
  }

  return projections
}

export const useStore = create<StoreState>(() => ({
  mockProjections: generateMockProjections(),
}))
