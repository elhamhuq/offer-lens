"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  MapPin,
  Building,
  Target,
  ArrowRight,
  Download,
  Share,
  Plus,
  Minus,
} from "lucide-react"
import type { Scenario } from "@/types"

interface ScenarioComparisonProps {
  scenarios: Scenario[]
  onAddScenario?: () => void
}

const mockScenarios: Scenario[] = [
  {
    id: "1",
    name: "TechCorp SF",
    jobOffer: {
      id: "1",
      title: "Senior Software Engineer",
      company: "TechCorp",
      salary: 180000,
      location: "San Francisco, CA",
      benefits: ["Health Insurance", "401k Match", "Stock Options"],
      uploadedAt: new Date(),
    },
    investments: [
      { id: "1", name: "S&P 500 Index", monthlyAmount: 1200, etfTicker: "SPY", riskLevel: "medium" },
      { id: "2", name: "Total International", monthlyAmount: 600, etfTicker: "VXUS", riskLevel: "medium" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "StartupXYZ Austin",
    jobOffer: {
      id: "2",
      title: "Senior Product Manager",
      company: "StartupXYZ",
      salary: 150000,
      location: "Austin, TX",
      benefits: ["Health Insurance", "Flexible PTO", "Remote Work"],
      uploadedAt: new Date(),
    },
    investments: [
      { id: "3", name: "Total Stock Market", monthlyAmount: 1500, etfTicker: "VTI", riskLevel: "medium" },
      { id: "4", name: "Bond Index", monthlyAmount: 300, etfTicker: "BND", riskLevel: "low" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function ScenarioComparison({ scenarios = mockScenarios, onAddScenario }: ScenarioComparisonProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(scenarios.slice(0, 2).map((s) => s.id))
  const [comparisonMetric, setComparisonMetric] = useState("total-value")
  const [timeHorizon, setTimeHorizon] = useState("30")

  const compareScenarios = selectedScenarios.map((id) => scenarios.find((s) => s.id === id)).filter((scenario): scenario is Scenario => scenario !== undefined)

  // Mock cost of living adjustments
  const costOfLivingIndex = {
    "San Francisco, CA": 1.8,
    "Austin, TX": 1.1,
    "Denver, CO": 1.2,
    "Nashville, TN": 1.0,
  }

  const calculateAdjustedSalary = (salary: number, location: string) => {
    const index = costOfLivingIndex[location as keyof typeof costOfLivingIndex] || 1.0
    return salary / index
  }

  const calculateProjectedValue = (scenario: Scenario, years: number) => {
    const monthlyInvestment = scenario.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0)
    const annualInvestment = monthlyInvestment * 12
    const annualReturn = 0.082 // 8.2%

    // Compound interest formula: FV = PMT * [((1 + r)^n - 1) / r]
    const futureValue = annualInvestment * (((1 + annualReturn) ** years - 1) / annualReturn)
    return futureValue
  }

  const calculateTakeHomePay = (salary: number) => {
    // Simplified tax calculation (approximately 28% effective rate)
    return salary * 0.72
  }

  const addScenarioToComparison = (scenarioId: string) => {
    if (!selectedScenarios.includes(scenarioId) && selectedScenarios.length < 3) {
      setSelectedScenarios([...selectedScenarios, scenarioId])
    }
  }

  const removeScenarioFromComparison = (scenarioId: string) => {
    setSelectedScenarios(selectedScenarios.filter((id) => id !== scenarioId))
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>Scenario Comparison</span>
          </CardTitle>
          <CardDescription>Compare job offers and investment strategies side-by-side</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Share className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-foreground">Compare:</label>
            <Select value={comparisonMetric} onValueChange={setComparisonMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total-value">Total Value</SelectItem>
                <SelectItem value="take-home">Take-Home Pay</SelectItem>
                <SelectItem value="cost-adjusted">Cost-Adjusted</SelectItem>
                <SelectItem value="investments">Investments</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-foreground">Timeline:</label>
            <Select value={timeHorizon} onValueChange={setTimeHorizon}>
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
        </div>

        {/* Scenario Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Selected Scenarios ({selectedScenarios.length}/3)</h4>
            {onAddScenario && (
              <Button variant="outline" size="sm" onClick={onAddScenario}>
                <Plus className="w-4 h-4 mr-1" />
                Add Scenario
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="flex items-center">
                {selectedScenarios.includes(scenario.id) ? (
                  <Badge
                    variant="default"
                    className="cursor-pointer bg-primary hover:bg-primary/90"
                    onClick={() => removeScenarioFromComparison(scenario.id)}
                  >
                    {scenario.name}
                    <Minus className="w-3 h-3 ml-1" />
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => addScenarioToComparison(scenario.id)}
                  >
                    {scenario.name}
                    <Plus className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Grid */}
        {compareScenarios.length > 0 && (
          <div className="space-y-6">
            {/* Header Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compareScenarios.map((scenario) => (
                <Card key={scenario.id} className="bg-muted/30 border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-center">{scenario.name}</CardTitle>
                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center space-x-1">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{scenario.jobOffer.company}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{scenario.jobOffer.location}</span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Comparison Metrics */}
            <div className="space-y-4">
              {/* Salary Comparison */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Salary Analysis</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {compareScenarios.map((scenario) => (
                    <Card key={`salary-${scenario.id}`} className="bg-card border-border">
                      <CardContent className="p-4 space-y-3">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Gross Salary</p>
                          <p className="text-xl font-bold text-foreground">
                            ${scenario.jobOffer.salary.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Take-Home Pay</p>
                          <p className="text-lg font-semibold text-accent">
                            ${calculateTakeHomePay(scenario.jobOffer.salary).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Cost-Adjusted Value</p>
                          <p className="text-lg font-semibold text-chart-2">
                            $
                            {calculateAdjustedSalary(
                              scenario.jobOffer.salary,
                              scenario.jobOffer.location,
                            ).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Investment Comparison */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Investment Strategy</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {compareScenarios.map((scenario) => {
                    const monthlyInvestment = scenario.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0)
                    const projectedValue = calculateProjectedValue(scenario, Number.parseInt(timeHorizon))

                    return (
                      <Card key={`investment-${scenario.id}`} className="bg-card border-border">
                        <CardContent className="p-4 space-y-3">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Monthly Investment</p>
                            <p className="text-xl font-bold text-foreground">${monthlyInvestment.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Number of ETFs</p>
                            <p className="text-lg font-semibold text-accent">{scenario.investments.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">{timeHorizon}-Year Value</p>
                            <p className="text-lg font-semibold text-chart-2">${projectedValue.toLocaleString()}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Key Metrics Comparison */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Long-Term Outlook</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {compareScenarios.map((scenario) => {
                    const monthlyInvestment = scenario.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0)
                    const takeHomePay = calculateTakeHomePay(scenario.jobOffer.salary)
                    const savingsRate = ((monthlyInvestment * 12) / scenario.jobOffer.salary) * 100
                    const projectedValue = calculateProjectedValue(scenario, Number.parseInt(timeHorizon))

                    return (
                      <Card key={`metrics-${scenario.id}`} className="bg-card border-border">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Savings Rate</span>
                            <span className="font-medium text-foreground">{savingsRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Monthly Surplus</span>
                            <span className="font-medium text-foreground">
                              ${(takeHomePay / 12 - monthlyInvestment - 4000).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Portfolio Value</span>
                            <span className="font-medium text-accent">${projectedValue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Risk Level</span>
                            <Badge variant="secondary" className="bg-accent/10 text-accent">
                              Moderate
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Winner Analysis */}
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span>Analysis Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-foreground mb-2">Best for Immediate Income</h5>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-primary">
                        {
                          compareScenarios.reduce((best, scenario) =>
                            scenario.jobOffer.salary > best.jobOffer.salary ? scenario : best,
                          ).name
                        }
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        $
                        {compareScenarios
                          .reduce((best, scenario) =>
                            scenario.jobOffer.salary > best.jobOffer.salary ? scenario : best,
                          )
                          .jobOffer.salary.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground mb-2">Best for Long-Term Wealth</h5>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-accent">
                        {
                          compareScenarios.reduce((best, scenario) =>
                            calculateProjectedValue(scenario, Number.parseInt(timeHorizon)) >
                            calculateProjectedValue(best, Number.parseInt(timeHorizon))
                              ? scenario
                              : best,
                          ).name
                        }
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        $
                        {calculateProjectedValue(
                          compareScenarios.reduce((best, scenario) =>
                            calculateProjectedValue(scenario, Number.parseInt(timeHorizon)) >
                            calculateProjectedValue(best, Number.parseInt(timeHorizon))
                              ? scenario
                              : best,
                          ),
                          Number.parseInt(timeHorizon),
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground mb-2">Best Cost-Adjusted Value</h5>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-chart-2">
                        {
                          compareScenarios.reduce((best, scenario) =>
                            calculateAdjustedSalary(scenario.jobOffer.salary, scenario.jobOffer.location) >
                            calculateAdjustedSalary(best.jobOffer.salary, best.jobOffer.location)
                              ? scenario
                              : best,
                          ).name
                        }
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        $
                        {calculateAdjustedSalary(
                          compareScenarios.reduce((best, scenario) =>
                            calculateAdjustedSalary(scenario.jobOffer.salary, scenario.jobOffer.location) >
                            calculateAdjustedSalary(best.jobOffer.salary, best.jobOffer.location)
                              ? scenario
                              : best,
                          ).jobOffer.salary,
                          compareScenarios.reduce((best, scenario) =>
                            calculateAdjustedSalary(scenario.jobOffer.salary, scenario.jobOffer.location) >
                            calculateAdjustedSalary(best.jobOffer.salary, best.jobOffer.location)
                              ? scenario
                              : best,
                          ).jobOffer.location,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground mb-2">Highest Savings Rate</h5>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-chart-4">
                        {
                          compareScenarios.reduce((best, scenario) => {
                            const bestRate =
                              (best.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0) * 12) /
                              best.jobOffer.salary
                            const scenarioRate =
                              (scenario.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0) * 12) /
                              scenario.jobOffer.salary
                            return scenarioRate > bestRate ? scenario : best
                          }).name
                        }
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {(
                          ((compareScenarios
                            .reduce((best, scenario) => {
                              const bestRate =
                                (best.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0) * 12) /
                                best.jobOffer.salary
                              const scenarioRate =
                                (scenario.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0) * 12) /
                                scenario.jobOffer.salary
                              return scenarioRate > bestRate ? scenario : best
                            })
                            .investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0) *
                            12) /
                            compareScenarios.reduce((best, scenario) => {
                              const bestRate =
                                (best.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0) * 12) /
                                best.jobOffer.salary
                              const scenarioRate =
                                (scenario.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0) * 12) /
                                scenario.jobOffer.salary
                              return scenarioRate > bestRate ? scenario : best
                            }).jobOffer.salary) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Consider non-financial factors like career growth, work-life balance, company culture, and personal
                    preferences when making your final decision. The best choice depends on your individual priorities
                    and life circumstances.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button variant="outline" className="bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export Comparison
              </Button>
              <Button className="bg-primary hover:bg-primary/90">
                <ArrowRight className="w-4 h-4 mr-2" />
                Get AI Analysis
              </Button>
            </div>
          </div>
        )}

        {compareScenarios.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No scenarios selected</h3>
            <p className="text-muted-foreground mb-6">
              Select 2-3 scenarios above to see a detailed side-by-side comparison.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
