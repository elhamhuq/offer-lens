"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Loader2,
  AlertCircle,
  Download,
  Share2
} from "lucide-react"
import { useStore } from "@/store/useStore"
import AnalysisResults from "@/components/AnalysisResults"

export default function ScenarioDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const scenarioId = params.id as string
  
  const { scenarios, isAuthenticated } = useStore()
  const [scenario, setScenario] = useState<any>(null)
  const [financialAnalysis, setFinancialAnalysis] = useState<any>(null)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [confidenceScores, setConfidenceScores] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("results")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/dashboard')
      return
    }

    // Find scenario from store
    const foundScenario = scenarios.find(s => s.id === scenarioId)
    if (!foundScenario) {
      setError('Scenario not found')
      setIsLoading(false)
      return
    }

    setScenario(foundScenario)
    
    // Convert scenario data to AnalysisResults format
    convertScenarioToAnalysisFormat(foundScenario)
    
    // Try to fetch matching financial analysis from database
    fetchMatchingFinancialAnalysis(foundScenario)
  }, [scenarioId, scenarios, isAuthenticated])

  const convertScenarioToAnalysisFormat = (scenario: any) => {
    // Convert JobOffer to ExtractedData format
    const extractedData = {
      company: scenario.jobOffer.company,
      jobTitle: scenario.jobOffer.title, // title -> jobTitle
      baseSalary: scenario.jobOffer.salary, // salary -> baseSalary  
      location: scenario.jobOffer.location,
      benefits: scenario.jobOffer.benefits || [],
      startDate: scenario.jobOffer.startDate,
      reportingStructure: '',
      additionalInfo: ''
    }

    setExtractedData(extractedData)
    
    // Set perfect confidence scores since this is user-created data
    setConfidenceScores({
      company: 1.0,
      jobTitle: 1.0,
      baseSalary: 1.0,
      location: 1.0,
      benefits: 1.0
    })
  }

  const fetchMatchingFinancialAnalysis = async (scenario: any) => {
    try {
      // Look for matching analysis in database based on company and salary
      const response = await fetch('/api/scenario/financial-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: scenario.jobOffer.company,
          baseSalary: scenario.jobOffer.salary,
          location: scenario.jobOffer.location,
        })
      })

      if (response.ok) {
        const analysis = await response.json()
        setFinancialAnalysis(analysis)
        console.log('✅ Found matching financial analysis')
      } else {
        console.log('ℹ️ No matching financial analysis found - this is normal for manual scenarios')
        // Generate a basic mock analysis based on scenario data
        generateMockAnalysis(scenario)
      }
    } catch (err) {
      console.error('Error fetching financial analysis:', err)
      generateMockAnalysis(scenario)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockAnalysis = (scenario: any) => {
    const monthlyGross = Math.round(scenario.jobOffer.salary / 12)
    const estimatedTaxes = Math.round(monthlyGross * 0.25) // 25% tax rate
    const netIncome = monthlyGross - estimatedTaxes
    const monthlyInvestment = scenario.investments.reduce((sum: number, inv: any) => sum + inv.monthlyAmount, 0)
    const estimatedExpenses = Math.max(netIncome - monthlyInvestment - 1000, 2000) // Leave $1k buffer
    const savingsPotential = Math.max(netIncome - estimatedExpenses, monthlyInvestment)

    const mockAnalysis = {
      summary: `This ${scenario.jobOffer.title} position at ${scenario.jobOffer.company} offers a competitive salary of $${scenario.jobOffer.salary.toLocaleString()}. With your planned monthly investment of $${monthlyInvestment.toLocaleString()}, you're setting yourself up for strong long-term wealth building.`,
      keyInsights: [
        {
          category: "compensation",
          insight: `Your annual salary of $${scenario.jobOffer.salary.toLocaleString()} provides a solid foundation for financial growth in ${scenario.jobOffer.location}.`,
          impact: "positive"
        },
        {
          category: "investment",
          insight: `Your monthly investment of $${monthlyInvestment.toLocaleString()} represents ${Math.round((monthlyInvestment / monthlyGross) * 100)}% of gross income, which is excellent for long-term wealth building.`,
          impact: "positive"
        },
        {
          category: "location", 
          insight: `${scenario.jobOffer.location} offers good opportunities for career growth and reasonable cost of living.`,
          impact: "neutral"
        }
      ],
      monthlyBreakdown: {
        grossIncome: monthlyGross,
        estimatedTaxes: estimatedTaxes,
        netIncome: netIncome,
        estimatedExpenses: estimatedExpenses,
        savingsPotential: savingsPotential
      },
      recommendations: [
        "Continue with your planned investment strategy",
        "Consider maximizing employer 401(k) matching if available",
        "Build an emergency fund of 6 months expenses",
        "Review and rebalance investments annually"
      ],
      comparisonPoints: [
        {
          factor: "Investment Rate",
          value: `${Math.round((monthlyInvestment / monthlyGross) * 100)}% of gross income`,
          benchmark: "Recommended 15-20% for strong wealth building"
        },
        {
          factor: "Projected 30-year Value",
          value: `$${(monthlyInvestment * 12 * 30 * 3.2 / 1000000).toFixed(1)}M`, // Rough 8% growth calc
          benchmark: "Based on historical 8% annual returns"
        }
      ]
    }

    setFinancialAnalysis(mockAnalysis)
  }

  const handleDataUpdate = async (updatedData: any) => {
    // For scenarios, we could update the scenario in the store
    // This would require adding an update function to useScenario hook
    console.log('Data update requested:', updatedData)
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading scenario details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !scenario) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Scenario not found. It may have been deleted.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header - exactly like analysis page */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {scenario.jobOffer.company || "Scenario Details"}
            </h1>
            <p className="text-gray-600">
              {scenario.jobOffer.title || "Position"} • {scenario.name}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard?edit=${scenario.id}`)}
          >
            <Download className="h-4 w-4 mr-2" />
            Edit Scenario
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert("Link copied to clipboard!")
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content Tabs - exactly like analysis page */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="results" className="gap-2">
            <FileText className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-6">
          {extractedData && (
            <AnalysisResults
              analysisId={`scenario-${scenarioId}`} // Fake analysis ID
              extractedData={extractedData}
              confidenceScores={confidenceScores}
              financialAnalysis={financialAnalysis}
              onUpdate={handleDataUpdate}
              // Don't include onChat since we're not implementing chat for scenarios yet
            />
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Investment Strategy Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Monthly Investment</h4>
                    <p className="text-2xl font-bold text-primary">
                      ${scenario.investments.reduce((sum: number, inv: any) => sum + inv.monthlyAmount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Number of ETFs</h4>
                    <p className="text-2xl font-bold">
                      {scenario.investments.length}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Investment Breakdown</h4>
                  {scenario.investments.map((investment: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{investment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {investment.etfTicker} • {investment.riskLevel} risk
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${investment.monthlyAmount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">per month</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
