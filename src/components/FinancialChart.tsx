"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, DollarSign, Target, Calendar, Download } from "lucide-react"
import { useStore } from "@/store/useStore"

interface FinancialChartProps {
  title?: string
  description?: string
  timeHorizon?: number
  showControls?: boolean
}

export default function FinancialChart({
  title = "Portfolio Projection",
  description = "Your investment growth over time",
  timeHorizon = 30,
  showControls = true,
}: FinancialChartProps) {
  const { mockProjections } = useStore()
  const [selectedTimeframe, setSelectedTimeframe] = useState("30")
  const [chartType, setChartType] = useState("growth")

  // Filter projections based on selected timeframe
  const filteredProjections = mockProjections.slice(0, Number.parseInt(selectedTimeframe))
  const currentProjection = filteredProjections[filteredProjections.length - 1]

  // Calculate key metrics
  const totalContributions = currentProjection?.contributions || 0
  const totalGrowth = currentProjection?.growth || 0
  const totalValue = currentProjection?.totalValue || 0
  const annualReturn =
    totalContributions > 0 ? ((totalGrowth / totalContributions) * 100) / Number.parseInt(selectedTimeframe) : 0

  // Mock chart data points for visualization
  const chartDataPoints = filteredProjections.map((projection, index) => ({
    year: projection.year,
    value: projection.totalValue,
    contributions: projection.contributions,
    growth: projection.growth,
    x: (index / (filteredProjections.length - 1)) * 100,
    y: 100 - (projection.totalValue / totalValue) * 80, // Invert Y for SVG
  }))

  const generatePath = (dataPoints: typeof chartDataPoints, valueKey: keyof (typeof chartDataPoints)[0]) => {
    if (dataPoints.length === 0) return ""

    const maxValue = Math.max(...dataPoints.map((d) => d[valueKey] as number))
    const points = dataPoints.map((point, index) => {
      const x = (index / (dataPoints.length - 1)) * 100
      const y = 100 - ((point[valueKey] as number) / maxValue) * 80
      return `${x},${y}`
    })

    return `M ${points.join(" L ")}`
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {showControls && (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        {showControls && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">Timeframe:</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 years</SelectItem>
                  <SelectItem value="20">20 years</SelectItem>
                  <SelectItem value="30">30 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">View:</label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Total Growth</SelectItem>
                  <SelectItem value="contributions">Contributions</SelectItem>
                  <SelectItem value="returns">Returns Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Total Value</span>
            </div>
            <p className="text-lg font-bold text-foreground">${totalValue.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Contributions</span>
            </div>
            <p className="text-lg font-bold text-foreground">${totalContributions.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp className="w-4 h-4 text-chart-2" />
              <span className="text-sm font-medium text-foreground">Growth</span>
            </div>
            <p className="text-lg font-bold text-foreground">${totalGrowth.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Calendar className="w-4 h-4 text-chart-3" />
              <span className="text-sm font-medium text-foreground">Annual Return</span>
            </div>
            <p className="text-lg font-bold text-foreground">{annualReturn.toFixed(1)}%</p>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative">
          <div className="h-64 bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg border border-border overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" opacity="0.1" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Chart area background */}
              <rect x="0" y="20" width="100" height="80" fill="url(#chartGradient)" opacity="0.1" />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(var(--color-accent))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Chart line */}
              {chartDataPoints.length > 1 && (
                <path
                  d={generatePath(chartDataPoints, "value")}
                  fill="none"
                  stroke="rgb(var(--color-accent))"
                  strokeWidth="0.5"
                  className="drop-shadow-sm"
                />
              )}

              {/* Data points */}
              {chartDataPoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="0.8"
                  fill="rgb(var(--color-accent))"
                  className="drop-shadow-sm"
                />
              ))}
            </svg>
          </div>

          {/* Chart overlay with year labels */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-muted-foreground">
            <span>{filteredProjections[0]?.year || 2024}</span>
            <span>{currentProjection?.year || 2054}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
            <span className="text-muted-foreground">Portfolio Value</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-muted-foreground">Contributions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
            <span className="text-muted-foreground">Investment Growth</span>
          </div>
        </div>

        {/* Projection Details */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Projection Details</h4>
            <Badge variant="secondary">{selectedTimeframe} year timeline</Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Monthly Investment</p>
              <p className="font-medium text-foreground">$1,500</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Expected Annual Return</p>
              <p className="font-medium text-foreground">8.2%</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Risk Level</p>
              <p className="font-medium text-foreground">Moderate</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
