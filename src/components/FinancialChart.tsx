"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Building2,
  Briefcase,
  ChevronDown,
  Download,
  ArrowUpRight,
  PiggyBank,
  Zap,
} from "lucide-react"
import { useJobOfferProjections } from "@/hooks/useJobOfferProjections"

interface FinancialChartProps {
  title?: string
  description?: string
  showControls?: boolean
}

interface ChartData {
  timeframe: number
  totalValue: number
  contributions: number
  growth: number
  annualReturn: number
}

interface TooltipData {
  x: number
  y: number
  value: number
  year: number
  visible: boolean
}

const generateProjections = (monthlyInvestment: number, annualReturn: number, salaryGrowthRate: number) => {
  const projections = []
  let totalContributions = 0
  let totalValue = 0

  for (let year = 1; year <= 30; year++) {
    const yearlyContribution = monthlyInvestment * 12 * Math.pow(1 + salaryGrowthRate, year - 1)
    totalContributions += yearlyContribution
    totalValue = (totalValue + yearlyContribution) * (1 + annualReturn)

    projections.push({
      year,
      contributions: totalContributions,
      growth: totalValue - totalContributions,
      totalValue: totalValue,
    })
  }

  return projections
}

export default function FinancialChart({
  title = "Portfolio Projections",
  description = "Compare investment growth across your analyzed job offers",
  showControls = true,
}: FinancialChartProps) {
  // Replace dummy data with real data from hook
  const { 
    jobOffers,
    selectedOffer, 
    selectOffer,
    projections: hookProjections, 
    assumptions, 
    setAssumptions, 
    suggestions,
    loadingSuggestions,
    loading, 
    error, 
    hasOffers,
    refreshOffers
  } = useJobOfferProjections()

  // Use real projections from hook, fallback to generated ones
  const [projections, setProjections] = useState(() =>
    generateProjections(1500, 0.082, 0.035)
  )

  useEffect(() => {
    if (hookProjections.length > 0) {
      setProjections(hookProjections)
    } else if (selectedOffer) {
      // Generate projections if hook doesn't provide them
      setProjections(generateProjections(
        assumptions.monthlyInvestment,
        assumptions.annualReturn,
        assumptions.salaryGrowthRate
      ))
    }
  }, [hookProjections, assumptions, selectedOffer])

  const [expandedChart, setExpandedChart] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState<Record<number, number>>({})
  const [tooltip, setTooltip] = useState<TooltipData>({ x: 0, y: 0, value: 0, year: 0, visible: false })
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({})

  // State and handlers for input fields and errors
  const [inputValues, setInputValues] = useState({
    monthlyInvestment: assumptions.monthlyInvestment.toString(),
    annualReturn: (assumptions.annualReturn * 100).toString(),
    salaryGrowth: (assumptions.salaryGrowthRate * 100).toString(),
  })

  const [inputErrors, setInputErrors] = useState({
    monthlyInvestment: "",
    annualReturn: "",
    salaryGrowth: "",
  })

  // Update input values when assumptions change
  useEffect(() => {
    setInputValues({
      monthlyInvestment: assumptions.monthlyInvestment.toString(),
      annualReturn: (assumptions.annualReturn * 100).toString(),
      salaryGrowth: (assumptions.salaryGrowthRate * 100).toString(),
    })
  }, [assumptions])

  const handleInputChange = (field: keyof typeof inputValues, value: string) => {
    setInputValues((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (inputErrors[field]) {
      setInputErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleInputBlur = (field: keyof typeof inputValues, value: string) => {
    let error = ""
    const numericValue = Number.parseFloat(value)

    if (isNaN(numericValue)) {
      error = "Please enter a valid number."
    } else {
      switch (field) {
        case "monthlyInvestment":
          if (numericValue < 0) error = "Cannot be negative."
          if (selectedOffer && numericValue > selectedOffer.savingsPotential) {
            error = `Exceeds available savings potential ($${selectedOffer.savingsPotential.toLocaleString()}/mo).`
          }
          break
        case "annualReturn":
          if (numericValue < 0 || numericValue > 100) error = "Must be between 0 and 100."
          break
        case "salaryGrowth":
          if (numericValue < 0 || numericValue > 100) error = "Must be between 0 and 100."
          break
      }
    }

    setInputErrors((prev) => ({ ...prev, [field]: error }))

    if (!error) {
      const updatedAssumptions = { ...assumptions }
      switch (field) {
        case "monthlyInvestment":
          updatedAssumptions.monthlyInvestment = numericValue
          break
        case "annualReturn":
          updatedAssumptions.annualReturn = numericValue / 100
          break
        case "salaryGrowth":
          updatedAssumptions.salaryGrowthRate = numericValue / 100
          break
      }
      setAssumptions(updatedAssumptions)
      setProjections(
        generateProjections(
          updatedAssumptions.monthlyInvestment,
          updatedAssumptions.annualReturn,
          updatedAssumptions.salaryGrowthRate,
        ),
      )
    }
  }

  const handleSuggestionClick = (monthlyAmount: number) => {
    setInputValues((prev) => ({ ...prev, monthlyInvestment: monthlyAmount.toString() }))
    const newAssumptions = { ...assumptions, monthlyInvestment: monthlyAmount }
    setAssumptions(newAssumptions)
    setProjections(
      generateProjections(monthlyAmount, newAssumptions.annualReturn, newAssumptions.salaryGrowthRate),
    )
    setInputErrors((prev) => ({ ...prev, monthlyInvestment: "" }))
  }

  const chartData: ChartData[] = [10, 20, 30].map((timeframe) => {
    const filteredProjections = projections.slice(0, timeframe)
    const currentProjection = filteredProjections[filteredProjections.length - 1]

    const totalContributions = currentProjection?.contributions || 0
    const totalGrowth = currentProjection?.growth || 0
    const totalValue = currentProjection?.totalValue || 0
    const annualReturn = totalContributions > 0 ? ((totalGrowth / totalContributions) * 100) / timeframe : 0

    return {
      timeframe,
      totalValue,
      contributions: totalContributions,
      growth: totalGrowth,
      annualReturn,
    }
  })

  useEffect(() => {
    const animateCharts = () => {
      chartData.forEach((_, index) => {
        const timeframe = [10, 20, 30][index]
        let progress = 0
        const interval = setInterval(() => {
          progress += 2
          setAnimationProgress((prev) => ({ ...prev, [timeframe]: Math.min(progress, 100) }))
          if (progress >= 100) {
            clearInterval(interval)
          }
        }, 25)
      })
    }

    const timer = setTimeout(animateCharts, 200)
    return () => clearTimeout(timer)
  }, [selectedOffer?.id])

  // ... [Keep all the existing helper functions: getPathAnimationStyle, generateAnimatedPath, generateGridLines, handleMouseMove, handleMouseLeave] ...

  const getPathAnimationStyle = (pathId: string, progress: number) => {
    const pathElement = pathRefs.current[pathId]
    if (!pathElement) return {}

    const pathLength = pathElement.getTotalLength()
    const drawLength = (pathLength * progress) / 100

    return {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength - drawLength,
      transition: "stroke-dashoffset 0.08s ease-out",
    }
  }

  const generateAnimatedPath = (timeframe: number, valueType: "totalValue" | "contributions" | "growth") => {
    const filteredProjections = projections.slice(0, timeframe)

    if (filteredProjections.length < 2) return ""

    const maxValue = Math.max(...filteredProjections.map((p) => p[valueType]))
    const points = filteredProjections.map((projection, index) => {
      const x = (index / (timeframe - 1)) * 100
      const y = 100 - (projection[valueType] / maxValue) * 80
      return `${x},${y}`
    })

    return `M ${points.join(" L ")}`
  }

  const generateGridLines = (timeframe: number) => {
    const interval = timeframe === 10 ? 1 : timeframe === 20 ? 2 : 3
    const lines = []

    for (let i = interval; i < timeframe; i += interval) {
      const x = (i / timeframe) * 100
      lines.push(
        <line
          key={i}
          x1={x}
          y1="0"
          x2={x}
          y2="100"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground/30"
          strokeDasharray="2,2"
        />,
      )
    }
    return lines
  }

  const handleMouseMove = (
    event: React.MouseEvent<SVGSVGElement>,
    timeframe: number,
    valueType: "totalValue" | "contributions" | "growth",
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const yearIndex = Math.round((x / 100) * (timeframe - 1))
    const year = Math.min(yearIndex, timeframe - 1)

    const filteredProjections = projections.slice(0, timeframe)
    const projection = filteredProjections[year]

    if (projection) {
      setTooltip({
        x: event.clientX,
        y: event.clientY - 10,
        value: projection[valueType],
        year: year + 1,
        visible: true,
      })
    }
  }

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  // ... [Keep all existing render functions: renderCollapsedChart, renderExpandedChart, renderChart] ...
  // I'll include the key parts here but keeping them exactly the same:

  const renderCollapsedChart = (data: ChartData) => {
    const progress = animationProgress[data.timeframe] || 0

    return (
      <Card
        key={`collapsed-${data.timeframe}`}
        className="bg-gradient-to-br from-card to-card/80 border-border/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] hover:border-primary/30 w-full group"
        onClick={() => setExpandedChart(data.timeframe)}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="font-semibold">{data.timeframe}Y Plan</span>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-chart-1" />
              <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-20 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg border border-border/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              onMouseMove={(e) => handleMouseMove(e, data.timeframe, "totalValue")}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id={`mini-gradient-${data.timeframe}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" className="[stop-color:hsl(var(--chart-1))]" stopOpacity="0.4" />
                  <stop offset="100%" className="[stop-color:hsl(var(--chart-1))]" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {generateGridLines(data.timeframe)}

              <path
                ref={(el) => {
                  pathRefs.current[`mini-${data.timeframe}`] = el
                }}
                d={generateAnimatedPath(data.timeframe, "totalValue")}
                fill="none"
                className="stroke-chart-1"
                strokeWidth="2"
                style={{
                  ...getPathAnimationStyle(`mini-${data.timeframe}`, progress),
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                }}
              />

              <path
                d={`${generateAnimatedPath(data.timeframe, "totalValue")} L 100,100 L 0,100 Z`}
                fill={`url(#mini-gradient-${data.timeframe})`}
                style={{
                  opacity: Math.min((progress / 100) * 0.5, 0.4),
                  transition: "opacity 0.3s ease-out",
                }}
              />
            </svg>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Projected Value</p>
            <p className="font-bold text-lg text-foreground">${(data.totalValue / 1000).toFixed(0)}k</p>
            <div className="flex items-center justify-center space-x-1 text-xs">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-600 font-medium">+{data.annualReturn.toFixed(1)}% avg</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderExpandedChart = (data: ChartData) => {
    const progress = animationProgress[data.timeframe] || 0

    return (
      <Card className="bg-gradient-to-br from-card to-card/95 border-border/60 transition-all duration-500 ease-in-out shadow-xl shadow-primary/5">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {data.timeframe} Year Investment Plan
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                Projected portfolio value:{" "}
                <span className="font-bold text-primary text-lg">${data.totalValue.toLocaleString()}</span>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedChart(null)}
              className="hover:bg-muted/50 rounded-full p-2"
            >
              <ChevronDown className="w-5 h-5 rotate-180" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Value Chart */}
            <div className="space-y-3 animate-in fade-in-0 slide-in-from-left-4 duration-700">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base flex items-center space-x-2">
                  <div className="p-1.5 bg-chart-1/10 rounded-md">
                    <DollarSign className="w-4 h-4 text-chart-1" />
                  </div>
                  <span>Total Portfolio</span>
                </h4>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                  <p className="font-bold text-chart-1">+{data.annualReturn.toFixed(1)}%</p>
                </div>
              </div>
              <div className="h-40 bg-gradient-to-br from-muted/20 to-muted/50 rounded-xl border border-border/50 relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onMouseMove={(e) => handleMouseMove(e, data.timeframe, "totalValue")}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <linearGradient id={`total-gradient-${data.timeframe}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" className="[stop-color:hsl(var(--chart-1))]" stopOpacity="0.5" />
                      <stop offset="100%" className="[stop-color:hsl(var(--chart-1))]" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {generateGridLines(data.timeframe)}

                  <path
                    d={`${generateAnimatedPath(data.timeframe, "totalValue")} L 100,100 L 0,100 Z`}
                    fill={`url(#total-gradient-${data.timeframe})`}
                    style={{
                      opacity: Math.min((progress / 100) * 0.5, 0.4),
                      transition: "opacity 0.3s ease-out",
                    }}
                  />
                  <path
                    ref={(el) => {
                      pathRefs.current[`total-${data.timeframe}`] = el
                    }}
                    d={generateAnimatedPath(data.timeframe, "totalValue")}
                    fill="none"
                    className="stroke-chart-1"
                    strokeWidth="3"
                    style={{
                      ...getPathAnimationStyle(`total-${data.timeframe}`, progress),
                      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
                    }}
                  />
                </svg>
              </div>
              <div className="text-center p-3 bg-gradient-to-r from-chart-1/5 to-chart-1/10 rounded-lg border border-chart-1/20">
                <p className="text-2xl font-bold text-chart-1 animate-in fade-in-0 duration-1000">
                  ${data.totalValue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Final Value</p>
              </div>
            </div>

            {/* Contributions Chart */}
            <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base flex items-center space-x-2">
                  <div className="p-1.5 bg-chart-2/10 rounded-md">
                    <PiggyBank className="w-4 h-4 text-chart-2" />
                  </div>
                  <span>Your Contributions</span>
                </h4>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Monthly Avg</p>
                  <p className="font-bold text-chart-2">${assumptions.monthlyInvestment.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-40 bg-gradient-to-br from-muted/20 to-muted/50 rounded-xl border border-border/50 relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onMouseMove={(e) => handleMouseMove(e, data.timeframe, "contributions")}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <linearGradient id={`contrib-gradient-${data.timeframe}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" className="[stop-color:hsl(var(--chart-2))]" stopOpacity="0.5" />
                      <stop offset="100%" className="[stop-color:hsl(var(--chart-2))]" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {generateGridLines(data.timeframe)}

                  <path
                    d={`${generateAnimatedPath(data.timeframe, "contributions")} L 100,100 L 0,100 Z`}
                    fill={`url(#contrib-gradient-${data.timeframe})`}
                    style={{
                      opacity: Math.min((progress / 100) * 0.5, 0.4),
                      transition: "opacity 0.3s ease-out",
                    }}
                  />
                  <path
                    ref={(el) => {
                      pathRefs.current[`contrib-${data.timeframe}`] = el
                    }}
                    d={generateAnimatedPath(data.timeframe, "contributions")}
                    fill="none"
                    className="stroke-chart-2"
                    strokeWidth="3"
                    style={{
                      ...getPathAnimationStyle(`contrib-${data.timeframe}`, progress),
                      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
                    }}
                  />
                </svg>
              </div>
              <div className="text-center p-3 bg-gradient-to-r from-chart-2/5 to-chart-2/10 rounded-lg border border-chart-2/20">
                <p className="text-2xl font-bold text-chart-2 animate-in fade-in-0 duration-1000 delay-100">
                  ${data.contributions.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Invested</p>
              </div>
            </div>

            {/* Growth Chart */}
            <div className="space-y-3 animate-in fade-in-0 slide-in-from-right-4 duration-700 delay-200">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base flex items-center space-x-2">
                  <div className="p-1.5 bg-chart-3/10 rounded-md">
                    <Zap className="w-4 h-4 text-chart-3" />
                  </div>
                  <span>Market Growth</span>
                </h4>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Return Rate</p>
                  <p className="font-bold text-chart-3">{(assumptions.annualReturn * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="h-40 bg-gradient-to-br from-muted/20 to-muted/50 rounded-xl border border-border/50 relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onMouseMove={(e) => handleMouseMove(e, data.timeframe, "growth")}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <linearGradient id={`growth-gradient-${data.timeframe}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" className="[stop-color:hsl(var(--chart-3))]" stopOpacity="0.5" />
                      <stop offset="100%" className="[stop-color:hsl(var(--chart-3))]" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {generateGridLines(data.timeframe)}

                  <path
                    d={`${generateAnimatedPath(data.timeframe, "growth")} L 100,100 L 0,100 Z`}
                    fill={`url(#growth-gradient-${data.timeframe})`}
                    style={{
                      opacity: Math.min((progress / 100) * 0.5, 0.4),
                      transition: "opacity 0.3s ease-out",
                    }}
                  />
                  <path
                    ref={(el) => {
                      pathRefs.current[`growth-${data.timeframe}`] = el
                    }}
                    d={generateAnimatedPath(data.timeframe, "growth")}
                    fill="none"
                    className="stroke-chart-3"
                    strokeWidth="3"
                    style={{
                      ...getPathAnimationStyle(`growth-${data.timeframe}`, progress),
                      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
                    }}
                  />
                </svg>
              </div>
              <div className="text-center p-3 bg-gradient-to-r from-chart-3/5 to-chart-3/10 rounded-lg border border-chart-3/20">
                <p className="text-2xl font-bold text-chart-3 animate-in fade-in-0 duration-1000 delay-200">
                  ${data.growth.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Investment Gains</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border/50 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
            <div className="text-center p-4 bg-gradient-to-br from-muted/40 to-muted/60 rounded-xl border border-border/50 hover:bg-muted/70 transition-all duration-300 hover:scale-105">
              <p className="text-sm text-muted-foreground font-medium">Monthly Investment</p>
              <p className="font-bold text-lg text-chart-1">${assumptions.monthlyInvestment.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-muted/40 to-muted/60 rounded-xl border border-border/50 hover:bg-muted/70 transition-all duration-300 hover:scale-105">
              <p className="text-sm text-muted-foreground font-medium">Annual Return</p>
              <p className="font-bold text-lg text-chart-2">{(assumptions.annualReturn * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-muted/40 to-muted/60 rounded-xl border border-border/50 hover:bg-muted/70 transition-all duration-300 hover:scale-105">
              <p className="text-sm text-muted-foreground font-medium">Total Return</p>
              <p className="font-bold text-lg text-chart-3">{((data.growth / data.contributions) * 100).toFixed(0)}%</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-muted/40 to-muted/60 rounded-xl border border-border/50 hover:bg-muted/70 transition-all duration-300 hover:scale-105">
              <p className="text-sm text-muted-foreground font-medium">Salary Growth</p>
              <p className="font-bold text-lg text-chart-4">{(assumptions.salaryGrowthRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderChart = (data: ChartData, index: number) => {
    const isExpanded = expandedChart === data.timeframe
    const progress = animationProgress[data.timeframe] || 0

    if (expandedChart && !isExpanded) {
      return null // Don't render non-expanded charts in the main area
    }

    if (isExpanded) {
      return renderExpandedChart(data)
    }

    return (
      <Card
        key={data.timeframe}
        className="bg-card border-border transition-all duration-500 ease-in-out cursor-pointer hover:shadow-md transform hover:scale-[1.02]"
        onClick={() => setExpandedChart(data.timeframe)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-chart-1" />
              <span>{data.timeframe} Year Plan</span>
            </CardTitle>
            <div className="transition-transform duration-300">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <CardDescription>
            Projected value: <span className="font-semibold text-foreground">${data.totalValue.toLocaleString()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg border border-border overflow-hidden">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              onMouseMove={(e) => handleMouseMove(e, data.timeframe, "totalValue")}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id={`gradient-${data.timeframe}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" className="[stop-color:hsl(var(--chart-1))]" stopOpacity="0.3" />
                  <stop offset="100%" className="[stop-color:hsl(var(--chart-1))]" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {generateGridLines(data.timeframe)}

              <path
                ref={(el) => {
                  pathRefs.current[`main-${data.timeframe}`] = el
                }}
                d={generateAnimatedPath(data.timeframe, "totalValue")}
                fill="none"
                className="stroke-chart-1"
                strokeWidth="2"
                style={{
                  ...getPathAnimationStyle(`main-${data.timeframe}`, progress),
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
                }}
              />

              <path
                d={`${generateAnimatedPath(data.timeframe, "totalValue")} L 100,100 L 0,100 Z`}
                fill={`url(#gradient-${data.timeframe})`}
                style={{
                  opacity: Math.min((progress / 100) * 0.4, 0.3),
                  transition: "opacity 0.3s ease-out",
                }}
              />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold">${(data.totalValue / 1000).toFixed(0)}k</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Growth</p>
              <p className="font-semibold text-chart-3">${(data.growth / 1000).toFixed(0)}k</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Return</p>
              <p className="font-semibold text-chart-2">{data.annualReturn.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6" />
              <span>Loading Your Job Offers...</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={refreshOffers} className="ml-2 bg-transparent">
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>
        {showControls && (
          <Button variant="outline" size="sm" className="hover:bg-muted/50 border-border/60 bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      {/* Job Offer Selection - Now using real data */}
      {showControls && hasOffers && (
        <Card className="bg-gradient-to-br from-card to-card/95 border-border/60 shadow-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <span>Select Job Offer</span>
            </CardTitle>
            <CardDescription className="text-base">
              Choose which analyzed job offer to use for projections ({jobOffers.length} available)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-8">
              {/* Seamless Dropdown integrated into the first card */}
{selectedOffer && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border border-border/50 relative">
    {/* Invisible Select overlay on first card */}
    <div className="relative">
      <Select
        value={selectedOffer?.id || ""}
        onValueChange={(offerId) => {
          const offer = jobOffers.find((o) => o.id === offerId)
          if (offer) selectOffer(offer)
        }}
      >
        <SelectTrigger className="absolute inset-0 z-10 opacity-0 cursor-pointer border-0 bg-transparent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {jobOffers.map((offer) => (
            <SelectItem key={offer.id} value={offer.id}>
              <div className="flex items-center space-x-4 py-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base">
                    {offer.company} - {offer.position}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ${offer.baseSalary?.toLocaleString()} • {offer.location}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Company/Role Display Card - shows behind the transparent dropdown */}
      <div className="flex items-center space-x-4 cursor-pointer hover:bg-primary/5 rounded-lg p-2 -m-2 transition-colors duration-200">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-xl">{selectedOffer.company}</p>
          <p className="text-base text-muted-foreground">{selectedOffer.position}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
      </div>
    </div>
    
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-chart-1/10 rounded-lg">
        <DollarSign className="w-6 h-6 text-chart-1" />
      </div>
      <div>
        <p className="font-semibold text-xl">${selectedOffer.netIncome.toLocaleString()}/mo</p>
        <p className="text-base text-muted-foreground">Net Income</p>
      </div>
    </div>
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-chart-2/10 rounded-lg">
        <Target className="w-6 h-6 text-chart-2" />
      </div>
      <div>
        <p className="font-semibold text-xl">${selectedOffer.savingsPotential.toLocaleString()}/mo</p>
        <p className="text-base text-muted-foreground">Savings Potential</p>
      </div>
    </div>
  </div>
)}

{/* Fallback for when no offer is selected */}
{!selectedOffer && (
  <Select
    value={selectedOffer?.id}
    onValueChange={(offerId) => {
      const offer = jobOffers.find((o) => o.id === offerId)
      if (offer) selectOffer(offer)
    }}
  >
    <SelectTrigger className="h-16 border-border/60 text-lg">
      <SelectValue placeholder="Select a job offer..." />
    </SelectTrigger>
    <SelectContent>
      {jobOffers.map((offer) => (
        <SelectItem key={offer.id} value={offer.id}>
          <div className="flex items-center space-x-4 py-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base">
                {offer.company} - {offer.position}
              </span>
              <span className="text-sm text-muted-foreground">
                ${offer.baseSalary?.toLocaleString()} • {offer.location}
              </span>
            </div>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)}


            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment Assumptions */}
      {showControls && selectedOffer && (
        <Card className="bg-gradient-to-br from-card to-card/95 border-border/60 shadow-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span>Investment Strategy</span>
            </CardTitle>
            <CardDescription className="text-base">
              Adjust these settings to see how different investment strategies affect your projections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="monthlyInvestment" className="text-base font-medium">
                  Monthly Investment
                </Label>
                <Input
                  id="monthlyInvestment"
                  type="text"
                  value={inputValues.monthlyInvestment}
                  onChange={(e) => handleInputChange("monthlyInvestment", e.target.value)}
                  onBlur={(e) => handleInputBlur("monthlyInvestment", e.target.value)}
                  className={`h-12 text-lg ${inputErrors.monthlyInvestment ? "border-red-500" : "border-border/60"}`}
                  placeholder="Enter amount"
                />
                {inputErrors.monthlyInvestment && (
                  <p className="text-sm text-red-500 mt-1">{inputErrors.monthlyInvestment}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Available: ${selectedOffer.savingsPotential.toLocaleString()}/mo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualReturn" className="text-base font-medium">
                  Expected Annual Return (%)
                </Label>
                <Input
                  id="annualReturn"
                  type="text"
                  value={inputValues.annualReturn}
                  onChange={(e) => handleInputChange("annualReturn", e.target.value)}
                  onBlur={(e) => handleInputBlur("annualReturn", e.target.value)}
                  className={`h-12 text-lg ${inputErrors.annualReturn ? "border-red-500" : "border-border/60"}`}
                  placeholder="8.2"
                />
                {inputErrors.annualReturn && <p className="text-sm text-red-500 mt-1">{inputErrors.annualReturn}</p>}
                <p className="text-sm text-muted-foreground">Typical range: 5-12%</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryGrowth" className="text-base font-medium">
                  Annual Salary Growth (%)
                </Label>
                <Input
                  id="salaryGrowth"
                  type="text"
                  value={inputValues.salaryGrowth}
                  onChange={(e) => handleInputChange("salaryGrowth", e.target.value)}
                  onBlur={(e) => handleInputBlur("salaryGrowth", e.target.value)}
                  className={`h-12 text-lg ${inputErrors.salaryGrowth ? "border-red-500" : "border-border/60"}`}
                  placeholder="3.0"
                />
                {inputErrors.salaryGrowth && <p className="text-sm text-red-500 mt-1">{inputErrors.salaryGrowth}</p>}
                <p className="text-sm text-muted-foreground">Typical range: 2-5%</p>
              </div>
            </div>

            {/* AI Suggestions - Now using real data */}
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <Label className="text-base font-medium">AI Investment Suggestions for {selectedOffer.company}</Label>
                  {loadingSuggestions && <RefreshCw className="w-4 h-4 animate-spin" />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="relative group">
                      <Button
                        variant="outline"
                        className="h-auto p-4 text-left w-full bg-gradient-to-br from-card to-card/80 border-border/60 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] transition-all duration-300"
                        onClick={() => handleSuggestionClick(suggestion.monthlyAmount)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                suggestion.riskLevel === "Conservative"
                                  ? "bg-green-500"
                                  : suggestion.riskLevel === "Moderate"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            ></div>
                            <div className="font-semibold">{suggestion.riskLevel}</div>
                          </div>
                          <div className="text-lg font-bold text-primary">${suggestion.monthlyAmount}/month</div>
                        </div>
                      </Button>

                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-popover border border-border rounded-lg shadow-xl text-sm max-w-xs z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                        <div className="font-semibold mb-2 text-primary">{suggestion.riskLevel} Strategy</div>
                        <div className="text-muted-foreground leading-relaxed">{suggestion.reasoning}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedOffer && (
        <div
          className={`transition-all duration-500 ease-in-out ${
            expandedChart ? "flex gap-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          }`}
        >
          {expandedChart && (
            <div className="flex flex-col gap-4 w-56 shrink-0">
              <h3 className="text-lg font-semibold text-muted-foreground px-3 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Other Plans</span>
              </h3>
              {chartData.filter((data) => data.timeframe !== expandedChart).map((data) => renderCollapsedChart(data))}
            </div>
          )}

          <div className={expandedChart ? "flex-1" : "contents"}>
            {chartData.map((data, index) => renderChart(data, index))}
          </div>
        </div>
      )}

      {/* Quick Compare Section - Now using real data */}
      {jobOffers.length > 1 && (
        <Card className="bg-gradient-to-br from-card to-card/95 border-border/60 shadow-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span>Quick Compare</span>
            </CardTitle>
            <CardDescription className="text-base">30-year projections across all your job offers</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {jobOffers.map((offer) => {
                // Quick calculation for comparison
                const monthlyInvest = Math.round(offer.savingsPotential * 0.6)
                const annualInvest = monthlyInvest * 12
                let totalValue = 0
                for (let year = 1; year <= 30; year++) {
                  totalValue = (totalValue + annualInvest) * 1.082
                }

                return (
                  <div
                    key={offer.id}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                      selectedOffer?.id === offer.id
                        ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-lg shadow-primary/10"
                        : "bg-gradient-to-r from-muted/30 to-muted/50 hover:from-muted/40 hover:to-muted/60 border-border/50"
                    }`}
                    onClick={() => selectOffer(offer)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{offer.company}</p>
                        <p className="text-sm text-muted-foreground">{offer.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl text-primary">${(totalValue / 1000000).toFixed(1)}M</p>
                      <p className="text-sm text-muted-foreground">30-year projection</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {tooltip.visible && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl px-4 py-3 text-sm pointer-events-none animate-in fade-in-0 zoom-in-95"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="font-bold text-lg text-primary">${tooltip.value.toLocaleString()}</p>
          <p className="text-muted-foreground">Year {tooltip.year}</p>
        </div>
      )}
    </div>
  )
}
