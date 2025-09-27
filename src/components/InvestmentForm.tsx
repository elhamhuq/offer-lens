"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  Shield,
  AlertTriangle,
  Info,
  DollarSign,
  Target,
  PieChart,
} from "lucide-react"
import type { Investment } from "@/types"

interface InvestmentFormProps {
  onInvestmentsChange?: (investments: Investment[]) => void
  initialInvestments?: Investment[]
  monthlyBudget?: number
}

const popularETFs = [
  { ticker: "SPY", name: "SPDR S&P 500 ETF", category: "Large Cap", risk: "medium", expense: 0.09 },
  { ticker: "VTI", name: "Vanguard Total Stock Market", category: "Total Market", risk: "medium", expense: 0.03 },
  { ticker: "VXUS", name: "Vanguard Total International", category: "International", risk: "medium", expense: 0.08 },
  { ticker: "BND", name: "Vanguard Total Bond Market", category: "Bonds", risk: "low", expense: 0.03 },
  { ticker: "VNQ", name: "Vanguard Real Estate", category: "REITs", risk: "high", expense: 0.12 },
  { ticker: "QQQ", name: "Invesco QQQ Trust", category: "Tech", risk: "high", expense: 0.2 },
  { ticker: "SCHD", name: "Schwab US Dividend Equity", category: "Dividend", risk: "medium", expense: 0.06 },
  { ticker: "VTIAX", name: "Vanguard Total International", category: "International", risk: "medium", expense: 0.11 },
]

const riskLevels = {
  low: { color: "text-chart-4", bg: "bg-chart-4/10", label: "Conservative" },
  medium: { color: "text-accent", bg: "bg-accent/10", label: "Moderate" },
  high: { color: "text-destructive", bg: "bg-destructive/10", label: "Aggressive" },
}

export default function InvestmentForm({
  onInvestmentsChange,
  initialInvestments = [],
  monthlyBudget = 2000,
}: InvestmentFormProps) {
  const [investments, setInvestments] = useState<Investment[]>(
    initialInvestments.length > 0
      ? initialInvestments
      : [
          {
            id: "1",
            name: "S&P 500 Index",
            monthlyAmount: 800,
            etfTicker: "SPY",
            riskLevel: "medium",
          },
        ],
  )

  const [selectedETF, setSelectedETF] = useState("")
  const [newAmount, setNewAmount] = useState(500)

  const totalMonthlyInvestment = investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0)
  const remainingBudget = monthlyBudget - totalMonthlyInvestment
  const budgetUtilization = (totalMonthlyInvestment / monthlyBudget) * 100

  const addInvestment = () => {
    if (!selectedETF) return

    const etf = popularETFs.find((e) => e.ticker === selectedETF)
    if (!etf) return

    const newInvestment: Investment = {
      id: Date.now().toString(),
      name: etf.name,
      monthlyAmount: newAmount,
      etfTicker: etf.ticker,
      riskLevel: etf.risk as "low" | "medium" | "high",
    }

    const updatedInvestments = [...investments, newInvestment]
    setInvestments(updatedInvestments)
    onInvestmentsChange?.(updatedInvestments)

    setSelectedETF("")
    setNewAmount(500)
  }

  const removeInvestment = (id: string) => {
    const updatedInvestments = investments.filter((inv) => inv.id !== id)
    setInvestments(updatedInvestments)
    onInvestmentsChange?.(updatedInvestments)
  }

  const updateInvestmentAmount = (id: string, amount: number) => {
    const updatedInvestments = investments.map((inv) => (inv.id === id ? { ...inv, monthlyAmount: amount } : inv))
    setInvestments(updatedInvestments)
    onInvestmentsChange?.(updatedInvestments)
  }

  const getRiskDistribution = () => {
    const distribution = { low: 0, medium: 0, high: 0 }
    investments.forEach((inv) => {
      distribution[inv.riskLevel] += inv.monthlyAmount
    })
    return distribution
  }

  const riskDistribution = getRiskDistribution()
  const overallRisk =
    totalMonthlyInvestment > 0
      ? (riskDistribution.low * 1 + riskDistribution.medium * 2 + riskDistribution.high * 3) / totalMonthlyInvestment
      : 0

  const getOverallRiskLevel = () => {
    if (overallRisk <= 1.5) return "low"
    if (overallRisk <= 2.5) return "medium"
    return "high"
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-primary" />
          <span>Investment Portfolio</span>
        </CardTitle>
        <CardDescription>Build your ETF portfolio and set monthly contribution amounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Monthly Budget</span>
              </div>
              <p className="text-lg font-bold text-foreground">${monthlyBudget.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Target className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Investing</span>
              </div>
              <p className="text-lg font-bold text-foreground">${totalMonthlyInvestment.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <PieChart className="w-4 h-4 text-chart-2" />
                <span className="text-sm font-medium text-foreground">Remaining</span>
              </div>
              <p className={`text-lg font-bold ${remainingBudget < 0 ? "text-destructive" : "text-foreground"}`}>
                ${remainingBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Utilization Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Budget Utilization</span>
            <span className="text-sm text-muted-foreground">{budgetUtilization.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                budgetUtilization > 100 ? "bg-destructive" : budgetUtilization > 80 ? "bg-accent" : "bg-primary"
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Current Investments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Current Investments</h4>
            <Badge variant="secondary" className={riskLevels[getOverallRiskLevel()].bg}>
              <Shield className="w-3 h-3 mr-1" />
              {riskLevels[getOverallRiskLevel()].label} Risk
            </Badge>
          </div>

          <div className="space-y-3">
            {investments.map((investment) => {
              const etf = popularETFs.find((e) => e.ticker === investment.etfTicker)
              return (
                <Card key={investment.id} className="bg-muted/30 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-foreground">{investment.etfTicker}</span>
                          <Badge
                            variant="secondary"
                            className={`${riskLevels[investment.riskLevel].bg} ${riskLevels[investment.riskLevel].color}`}
                          >
                            {riskLevels[investment.riskLevel].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{investment.name}</p>
                        {etf && (
                          <p className="text-xs text-muted-foreground">
                            {etf.category} • {etf.expense}% expense ratio
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInvestment(investment.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Monthly Amount</Label>
                        <span className="text-sm font-medium text-foreground">
                          ${investment.monthlyAmount.toLocaleString()}
                        </span>
                      </div>
                      <Slider
                        value={[investment.monthlyAmount]}
                        onValueChange={([value]) => updateInvestmentAmount(investment.id, value)}
                        max={Math.min(2000, remainingBudget + investment.monthlyAmount)}
                        min={100}
                        step={50}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$100</span>
                        <span>${Math.min(2000, remainingBudget + investment.monthlyAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Add New Investment */}
        <Card className="bg-accent/5 border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Investment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select ETF</Label>
                <Select value={selectedETF} onValueChange={setSelectedETF}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an ETF" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularETFs.map((etf) => (
                      <SelectItem key={etf.ticker} value={etf.ticker}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span className="font-medium">{etf.ticker}</span>
                            <span className="text-muted-foreground ml-2">{etf.name}</span>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`ml-2 ${riskLevels[etf.risk as keyof typeof riskLevels].bg}`}
                          >
                            {riskLevels[etf.risk as keyof typeof riskLevels].label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Monthly Amount</Label>
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  min={100}
                  max={remainingBudget}
                  step={50}
                  placeholder="500"
                />
              </div>
            </div>

            {selectedETF && (
              <div className="p-3 bg-muted/30 rounded-lg">
                {(() => {
                  const etf = popularETFs.find((e) => e.ticker === selectedETF)
                  return (
                    etf && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{etf.name}</span>
                          <Badge
                            variant="secondary"
                            className={`${riskLevels[etf.risk as keyof typeof riskLevels].bg} ${riskLevels[etf.risk as keyof typeof riskLevels].color}`}
                          >
                            {riskLevels[etf.risk as keyof typeof riskLevels].label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <span className="ml-1 text-foreground">{etf.category}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expense Ratio:</span>
                            <span className="ml-1 text-foreground">{etf.expense}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  )
                })()}
              </div>
            )}

            <Button
              onClick={addInvestment}
              disabled={!selectedETF || newAmount <= 0 || newAmount > remainingBudget}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Portfolio
            </Button>
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <Card className="bg-muted/30 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Risk Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-chart-4">${riskDistribution.low.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Conservative</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent">${riskDistribution.medium.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Moderate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">${riskDistribution.high.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Aggressive</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Risk Level</span>
                <span className={`font-medium ${riskLevels[getOverallRiskLevel()].color}`}>
                  {riskLevels[getOverallRiskLevel()].label}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    getOverallRiskLevel() === "low"
                      ? "bg-chart-4"
                      : getOverallRiskLevel() === "medium"
                        ? "bg-accent"
                        : "bg-destructive"
                  }`}
                  style={{ width: `${(overallRisk / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warnings and Tips */}
        {remainingBudget < 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Your investments exceed your monthly budget by ${Math.abs(remainingBudget).toLocaleString()}. Consider
              reducing some allocations.
            </AlertDescription>
          </Alert>
        )}

        {investments.length === 1 && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Consider diversifying your portfolio by adding investments in different asset classes or geographic
              regions.
            </AlertDescription>
          </Alert>
        )}

        {budgetUtilization < 50 && (
          <Alert>
            <TrendingUp className="w-4 h-4" />
            <AlertDescription>
              You're only using {budgetUtilization.toFixed(1)}% of your investment budget. Consider increasing your
              contributions to maximize long-term growth.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
