/**
 * Response formatting and parsing utilities for Gemini API responses
 * Ensures consistent, user-friendly output formatting
 */

import type { 
  FinancialAnalysis, 
  ConversationalResponse 
} from '@/lib/gemini'
import type { ExtractedData } from '@/types/analysis'

/**
 * Format currency values consistently
 */
export function formatCurrency(amount: number, includeDecimal: boolean = false): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: includeDecimal ? 2 : 0,
    maximumFractionDigits: includeDecimal ? 2 : 0,
  })
  return formatter.format(amount)
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimalPlaces: number = 1): string {
  return `${(value * 100).toFixed(decimalPlaces)}%`
}

/**
 * Format large numbers with abbreviations (e.g., 150K, 1.2M)
 */
export function formatCompactNumber(value: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
  return formatter.format(value)
}

/**
 * Parse and format financial analysis response for UI display
 */
export function formatFinancialAnalysis(analysis: FinancialAnalysis): {
  summary: string
  insights: Array<{
    icon: string
    title: string
    description: string
    impact: 'positive' | 'negative' | 'neutral'
    color: string
  }>
  metrics: Array<{
    label: string
    value: string
    trend?: 'up' | 'down' | 'stable'
    description?: string
  }>
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    impact: string
  }>
  monthlyBudget: {
    income: { gross: string; net: string; taxes: string }
    expenses: { estimated: string; detailed?: Record<string, string> }
    savings: { amount: string; percentage: string }
  }
} {
  // Map impact to colors and icons
  const impactConfig = {
    positive: { color: 'green', icon: '📈' },
    negative: { color: 'red', icon: '📉' },
    neutral: { color: 'gray', icon: '➡️' },
  }

  // Map category to icons
  const categoryIcons: Record<string, string> = {
    compensation: '💰',
    benefits: '🎁',
    growth: '🚀',
    location: '📍',
    worklife: '⚖️',
  }

  // Format insights with visual elements
  const formattedInsights = analysis.keyInsights.map(insight => ({
    icon: categoryIcons[insight.category] || '📊',
    title: insight.category.charAt(0).toUpperCase() + insight.category.slice(1),
    description: insight.insight,
    impact: insight.impact,
    color: impactConfig[insight.impact].color,
  }))

  // Format monthly budget breakdown
  const monthlyBudget = {
    income: {
      gross: formatCurrency(analysis.monthlyBreakdown.grossIncome),
      net: formatCurrency(analysis.monthlyBreakdown.netIncome),
      taxes: formatCurrency(analysis.monthlyBreakdown.estimatedTaxes),
    },
    expenses: {
      estimated: formatCurrency(analysis.monthlyBreakdown.estimatedExpenses || 0),
      detailed: {},
    },
    savings: {
      amount: formatCurrency(analysis.monthlyBreakdown.savingsPotential || 0),
      percentage: formatPercentage(
        (analysis.monthlyBreakdown.savingsPotential || 0) / 
        analysis.monthlyBreakdown.netIncome
      ),
    },
  }

  // Create key metrics from monthly breakdown and comparison points
  const metrics = [
    {
      label: 'Annual Gross',
      value: formatCurrency(analysis.monthlyBreakdown.grossIncome * 12),
      trend: 'stable' as const,
    },
    {
      label: 'Monthly Net',
      value: formatCurrency(analysis.monthlyBreakdown.netIncome),
      description: 'After estimated taxes',
    },
    {
      label: 'Savings Rate',
      value: monthlyBudget.savings.percentage,
      trend: (analysis.monthlyBreakdown.savingsPotential || 0) > 
             (analysis.monthlyBreakdown.netIncome * 0.2) ? 'up' as const : 'down' as const,
    },
    ...analysis.comparisonPoints.map(point => ({
      label: point.factor,
      value: point.value,
      description: point.benchmark,
    })),
  ]

  // Prioritize recommendations
  const formattedRecommendations = analysis.recommendations.map((rec, index) => ({
    priority: index < 2 ? 'high' as const : index < 5 ? 'medium' as const : 'low' as const,
    action: rec,
    impact: index < 2 ? 'Immediate action recommended' : 
            index < 5 ? 'Consider within 30 days' : 
            'Long-term optimization',
  }))

  return {
    summary: analysis.summary,
    insights: formattedInsights,
    metrics,
    recommendations: formattedRecommendations,
    monthlyBudget,
  }
}

/**
 * Format conversational response for chat UI
 */
export function formatConversationalResponse(response: ConversationalResponse): {
  message: string
  dataPoints?: Array<{ icon: string; label: string; value: string }>
  suggestions: string[]
  timestamp: string
} {
  const dataIcons: Record<string, string> = {
    salary: '💵',
    location: '📍',
    benefits: '🎁',
    growth: '📈',
    comparison: '⚖️',
    default: '📊',
  }

  const formattedDataPoints = response.supportingData?.map(data => ({
    icon: dataIcons[data.label.toLowerCase()] || dataIcons.default,
    label: data.label,
    value: data.value,
  }))

  return {
    message: response.answer,
    dataPoints: formattedDataPoints,
    suggestions: response.followUpQuestions,
    timestamp: new Date().toLocaleTimeString(),
  }
}

/**
 * Parse and validate Gemini response with error handling
 */
export function parseGeminiResponse<T>(
  response: any,
  schema: {
    parse: (data: any) => T
    safeParse?: (data: any) => { success: boolean; data?: T; error?: any }
  }
): { success: boolean; data?: T; error?: string } {
  try {
    // Try safe parse if available
    if (schema.safeParse) {
      const result = schema.safeParse(response)
      if (!result.success) {
        return {
          success: false,
          error: `Validation failed: ${result.error?.message || 'Unknown error'}`,
        }
      }
      return { success: true, data: result.data }
    }

    // Fallback to regular parse
    const data = schema.parse(response)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to parse Gemini response:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse response',
    }
  }
}

/**
 * Format comparison analysis for multiple offers
 */
export function formatComparisonAnalysis(
  comparison: {
    recommendation: string
    comparison: Array<{
      company: string
      pros: string[]
      cons: string[]
      score: number
    }>
    rationale: string
  }
): {
  winner: { company: string; score: number; badge: string }
  detailed: Array<{
    company: string
    score: number
    scoreColor: string
    pros: Array<{ text: string; icon: string }>
    cons: Array<{ text: string; icon: string }>
    verdict: string
  }>
  summary: string
  rationale: string
} {
  // Find the winner
  const winner = comparison.comparison.reduce((prev, current) => 
    current.score > prev.score ? current : prev
  )

  // Format detailed comparison
  const detailed = comparison.comparison.map(offer => ({
    company: offer.company,
    score: offer.score,
    scoreColor: offer.score >= 80 ? 'green' : 
                offer.score >= 60 ? 'yellow' : 'red',
    pros: offer.pros.map(pro => ({
      text: pro,
      icon: '✅',
    })),
    cons: offer.cons.map(con => ({
      text: con,
      icon: '⚠️',
    })),
    verdict: offer.score >= 80 ? 'Excellent Opportunity' :
             offer.score >= 60 ? 'Good Option' :
             'Consider Carefully',
  }))

  return {
    winner: {
      company: winner.company,
      score: winner.score,
      badge: '🏆 Top Choice',
    },
    detailed,
    summary: comparison.recommendation,
    rationale: comparison.rationale,
  }
}

/**
 * Format financial projections for visualization
 */
export function formatProjections(
  projections: {
    projections: Array<{
      year: number
      salary: number
      savings: number
      netWorth: number
    }>
    assumptions: string[]
    insights: string[]
  }
): {
  chartData: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      color: string
      type: 'line' | 'bar'
    }>
  }
  summary: {
    totalSaved: string
    finalNetWorth: string
    salaryGrowth: string
    avgSavingsRate: string
  }
  assumptions: Array<{ text: string; confidence: 'high' | 'medium' | 'low' }>
  insights: Array<{ text: string; type: 'opportunity' | 'risk' | 'info' }>
} {
  const years = projections.projections.map(p => p.year)
  const salaries = projections.projections.map(p => p.salary)
  const savings = projections.projections.map(p => p.savings)
  const netWorth = projections.projections.map(p => p.netWorth)

  // Calculate summary metrics
  const totalSaved = savings.reduce((sum, s) => sum + s, 0)
  const finalNetWorth = netWorth[netWorth.length - 1] || 0
  const salaryGrowth = ((salaries[salaries.length - 1] - salaries[0]) / salaries[0])
  const avgSavingsRate = savings.reduce((sum, s, i) => 
    sum + (s / salaries[i]), 0) / savings.length

  // Categorize assumptions by confidence
  const categorizedAssumptions = projections.assumptions.map(assumption => ({
    text: assumption,
    confidence: assumption.includes('conservative') ? 'high' :
                assumption.includes('assume') ? 'medium' : 'low' as const,
  }))

  // Categorize insights
  const categorizedInsights = projections.insights.map(insight => ({
    text: insight,
    type: insight.toLowerCase().includes('risk') ? 'risk' :
          insight.toLowerCase().includes('opportunit') ? 'opportunity' : 
          'info' as const,
  }))

  return {
    chartData: {
      labels: years.map(y => `Year ${y}`),
      datasets: [
        {
          label: 'Salary',
          data: salaries,
          color: '#3B82F6', // blue
          type: 'line',
        },
        {
          label: 'Annual Savings',
          data: savings,
          color: '#10B981', // green
          type: 'bar',
        },
        {
          label: 'Net Worth',
          data: netWorth,
          color: '#8B5CF6', // purple
          type: 'line',
        },
      ],
    },
    summary: {
      totalSaved: formatCurrency(totalSaved),
      finalNetWorth: formatCurrency(finalNetWorth),
      salaryGrowth: formatPercentage(salaryGrowth),
      avgSavingsRate: formatPercentage(avgSavingsRate),
    },
    assumptions: categorizedAssumptions,
    insights: categorizedInsights,
  }
}

/**
 * Create a markdown summary of the analysis
 */
export function createMarkdownSummary(
  data: ExtractedData,
  analysis: FinancialAnalysis
): string {
  const formatted = formatFinancialAnalysis(analysis)
  
  return `# Job Offer Analysis: ${data.company}

## Position Details
- **Role:** ${data.jobTitle}
- **Location:** ${data.location}
- **Base Salary:** ${formatCurrency(data.baseSalary)}
- **Start Date:** ${data.startDate || 'TBD'}

## Executive Summary
${analysis.summary}

## Monthly Budget Breakdown
- **Gross Income:** ${formatted.monthlyBudget.income.gross}
- **Taxes:** ${formatted.monthlyBudget.income.taxes}
- **Net Income:** ${formatted.monthlyBudget.income.net}
- **Estimated Expenses:** ${formatted.monthlyBudget.expenses.estimated}
- **Savings Potential:** ${formatted.monthlyBudget.savings.amount} (${formatted.monthlyBudget.savings.percentage})

## Key Insights
${formatted.insights.map(i => `- **${i.title}** ${i.icon}: ${i.description}`).join('\n')}

## Recommendations
${formatted.recommendations.map(r => `- [${r.priority.toUpperCase()}] ${r.action}`).join('\n')}

## Key Metrics
${formatted.metrics.map(m => `- **${m.label}:** ${m.value}${m.description ? ` (${m.description})` : ''}`).join('\n')}
`
}

/**
 * Format error messages for user display
 */
export function formatErrorMessage(error: any): {
  title: string
  message: string
  suggestion: string
  retryable: boolean
} {
  const errorString = error?.message || error?.toString() || 'Unknown error'
  
  // Categorize errors
  if (errorString.includes('API key')) {
    return {
      title: 'Configuration Error',
      message: 'Gemini API key is not configured',
      suggestion: 'Please add your Google Gemini API key to the environment variables',
      retryable: false,
    }
  }
  
  if (errorString.includes('rate limit')) {
    return {
      title: 'Rate Limit Exceeded',
      message: 'Too many requests to Gemini API',
      suggestion: 'Please wait a moment before trying again',
      retryable: true,
    }
  }
  
  if (errorString.includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The analysis is taking longer than expected',
      suggestion: 'Try again with a simpler query or check your connection',
      retryable: true,
    }
  }
  
  if (errorString.includes('parse') || errorString.includes('validation')) {
    return {
      title: 'Processing Error',
      message: 'Failed to process the AI response',
      suggestion: 'Try rephrasing your question or simplifying the analysis',
      retryable: true,
    }
  }
  
  // Default error
  return {
    title: 'Analysis Error',
    message: errorString,
    suggestion: 'Please try again or contact support if the issue persists',
    retryable: true,
  }
}
