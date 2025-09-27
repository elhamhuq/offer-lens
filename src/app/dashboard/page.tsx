"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import FileUpload from "@/components/FileUpload"
import InvestmentForm from "@/components/InvestmentForm"
import FinancialChart from "@/components/FinancialChart"
import ScenarioComparison from "@/components/ScenarioComparison"
import AIExplanation from "@/components/AIExplanation"
import { useStore } from "@/store/useStore"
import { Calculator, TrendingUp, Brain, BarChart3, Upload, Target } from "lucide-react"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const { scenarios, addScenario, currentScenario, setCurrentScenario } = useStore()

  const handleFileProcessed = (data: any) => {
    if (data) {
      const newScenario = {
        id: Date.now().toString(),
        name: `${data.company} - ${data.title}`,
        jobOffer: {
          id: Date.now().toString(),
          title: data.title,
          company: data.company,
          salary: data.salary,
          location: data.location,
          benefits: data.benefits,
          uploadedAt: new Date()
        },
        investments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      addScenario(newScenario)
      setCurrentScenario(newScenario)
    }
  }

  const tabs = [
    { id: "upload", label: "Upload Offers", icon: Upload },
    { id: "invest", label: "Investment Strategy", icon: Target },
    { id: "analyze", label: "Financial Analysis", icon: BarChart3 },
    { id: "compare", label: "Compare Scenarios", icon: TrendingUp },
    { id: "ai", label: "AI Insights", icon: Brain }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Cashflow Compass</h1>
                <p className="text-sm text-muted-foreground">Navigate your financial future with confidence</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                {scenarios.length} Scenarios
              </Badge>
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "text-primary border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {activeTab === "upload" && (
            <div className="grid lg:grid-cols-2 gap-8">
              <FileUpload onFileProcessed={handleFileProcessed} />
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>
                    Upload your job offer documents to begin analyzing your financial future
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Supported formats:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PDF documents</li>
                      <li>• Text files (.txt)</li>
                      <li>• Word documents (.doc, .docx)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">What we extract:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Salary and compensation</li>
                      <li>• Benefits and perks</li>
                      <li>• Job location</li>
                      <li>• Company information</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "invest" && (
            <InvestmentForm 
              monthlyBudget={currentScenario?.jobOffer.salary ? currentScenario.jobOffer.salary * 0.15 : 2000}
            />
          )}

          {activeTab === "analyze" && (
            <FinancialChart 
              title="Portfolio Growth Projection"
              description="See how your investments grow over time"
            />
          )}

          {activeTab === "compare" && (
            <ScenarioComparison 
              scenarios={scenarios}
              onAddScenario={() => setActiveTab("upload")}
            />
          )}

          {activeTab === "ai" && currentScenario && (
            <AIExplanation 
              scenario={currentScenario}
              type="scenario"
            />
          )}

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{scenarios.length}</div>
                <div className="text-sm text-muted-foreground">Job Offers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">
                  ${currentScenario?.jobOffer.salary?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-muted-foreground">Current Salary</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-chart-2">
                  ${currentScenario?.investments?.reduce((sum, inv) => sum + inv.monthlyAmount, 0).toLocaleString() || "0"}
                </div>
                <div className="text-sm text-muted-foreground">Monthly Investment</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-chart-3">8.2%</div>
                <div className="text-sm text-muted-foreground">Expected Return</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}