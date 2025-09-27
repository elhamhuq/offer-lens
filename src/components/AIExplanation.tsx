"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw as Refresh,
} from "lucide-react"

interface AIExplanationProps {
  scenario?: {
    jobOffer: {
      company: string
      salary: number
      location: string
    }
    investments: Array<{
      name: string
      monthlyAmount: number
      riskLevel: string
    }>
  }
  type?: "scenario" | "investment" | "comparison"
}

export default function AIExplanation({ scenario, type = "scenario" }: AIExplanationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [explanation, setExplanation] = useState("")

  // Mock AI explanations based on type
  const mockExplanations = {
    scenario: `Based on your job offer at ${scenario?.jobOffer.company || "TechCorp"} with a salary of $${scenario?.jobOffer.salary?.toLocaleString() || "150,000"}, here's what this means for your financial future:

**Salary Analysis:**
Your gross salary of $${scenario?.jobOffer.salary?.toLocaleString() || "150,000"} in ${scenario?.jobOffer.location || "San Francisco, CA"} translates to approximately $108,000 take-home pay after taxes and deductions. Given the high cost of living in this area, your purchasing power is equivalent to about $85,000 in a lower-cost city.

**Investment Strategy:**
With your planned monthly investment of $${scenario?.investments?.reduce((sum, inv) => sum + inv.monthlyAmount, 0) || "1,500"}, you're on track to build substantial wealth over time. This represents about 17% of your gross income, which exceeds the recommended 15% savings rate.

**Long-term Outlook:**
If you maintain this investment strategy for 30 years with an average 8.2% annual return, your portfolio could grow to approximately $2.4 million. This assumes consistent contributions and market performance aligned with historical averages.

**Key Recommendations:**
1. Consider maximizing your 401(k) match if available
2. Build an emergency fund of 6 months expenses ($54,000)
3. Diversify across different asset classes to manage risk
4. Review and rebalance your portfolio annually`,

    investment: `Your investment portfolio shows a well-balanced approach to long-term wealth building:

**Portfolio Composition:**
You're investing $1,500 monthly across diversified ETFs, which is an excellent foundation. The mix of broad market index funds provides good exposure to both domestic and international markets.

**Risk Assessment:**
Your moderate risk level is appropriate for long-term goals. The selected ETFs have historically provided steady growth with manageable volatility.

**Expected Returns:**
Based on historical performance, your portfolio could generate 8-10% annual returns over the long term. This accounts for market fluctuations and economic cycles.

**Optimization Suggestions:**
Consider adding a small allocation to emerging markets or REITs for additional diversification. Also, ensure you're taking advantage of tax-advantaged accounts first.`,

    comparison: `Comparing your scenarios reveals important trade-offs between immediate income and long-term wealth building:

**Scenario A vs B Analysis:**
The higher salary option provides $20,000 more annually but comes with significantly higher living costs. After adjusting for cost of living, the effective difference is only about $8,000 per year.

**Investment Impact:**
Both scenarios allow for similar investment amounts, but the location differences affect your overall financial flexibility. The lower-cost area provides more discretionary income for additional investments.

**Recommendation:**
Consider the non-financial factors like career growth, work-life balance, and personal preferences. From a purely financial perspective, both paths lead to similar long-term outcomes.`,
  }

  const generateExplanation = () => {
    setIsGenerating(true)
    // Simulate AI generation delay
    setTimeout(() => {
      setExplanation(mockExplanations[type])
      setIsGenerating(false)
    }, 2000)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(explanation)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-primary" />
            <span>AI Financial Insights</span>
          </CardTitle>
          <CardDescription>Get personalized explanations and recommendations in plain English</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          {explanation && (
            <>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={generateExplanation}>
                <Refresh className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!explanation && !isGenerating && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Get AI-Powered Insights</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Our AI will analyze your scenario and provide personalized financial advice in easy-to-understand
              language.
            </p>
            <Button onClick={generateExplanation} className="bg-primary hover:bg-primary/90">
              <Brain className="w-4 h-4 mr-2" />
              Generate Explanation
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Analyzing Your Scenario</h3>
            <p className="text-muted-foreground mb-4">
              Our AI is processing your data and generating personalized insights...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          </div>
        )}

        {explanation && (
          <div className="space-y-6">
            {/* AI Badge */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Brain className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
              <div className="text-xs text-muted-foreground">Generated just now</div>
            </div>

            {/* Explanation Content */}
            <div className="prose prose-sm max-w-none">
              <div className="text-foreground leading-relaxed whitespace-pre-line">{explanation}</div>
            </div>

            {/* Key Insights */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-accent" />
                    <span className="font-medium text-foreground">Key Insight</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your investment rate of 17% exceeds recommended guidelines, putting you on an excellent path to
                    financial independence.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-chart-2/5 border-chart-2/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-chart-2" />
                    <span className="font-medium text-foreground">Projection</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Maintaining current strategy could result in $2.4M portfolio value by retirement age.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Risk Considerations */}
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="font-medium text-foreground">Important Considerations</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Market returns are not guaranteed and may vary significantly</li>
                  <li>• Consider building emergency fund before aggressive investing</li>
                  <li>• Review and adjust strategy based on life changes</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feedback */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Was this explanation helpful?</p>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
