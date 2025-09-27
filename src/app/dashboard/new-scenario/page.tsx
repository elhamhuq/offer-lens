"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Upload, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useScenario } from "@/hooks/useScenario"
import FileUpload from "@/components/FileUpload"
import InvestmentForm from "@/components/InvestmentForm"
import type { JobOffer, Investment } from "@/types"

export default function NewScenarioPage() {
  const [scenarioName, setScenarioName] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [jobOffer, setJobOffer] = useState<Partial<JobOffer>>({})
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isManualEntry, setIsManualEntry] = useState(false)

  const { createScenario } = useScenario()
  const router = useRouter()

  const handleFileProcessed = (data: any) => {
    setJobOffer({
      id: Date.now().toString(),
      title: data.title,
      company: data.company,
      salary: data.salary,
      location: data.location,
      benefits: data.benefits,
      uploadedAt: new Date(),
    })
    setCurrentStep(2)
  }

  const handleManualJobEntry = () => {
    if (jobOffer.title && jobOffer.company && jobOffer.salary && jobOffer.location) {
      setCurrentStep(2)
    }
  }

  const handleInvestmentsChange = (newInvestments: Investment[]) => {
    setInvestments(newInvestments)
  }

  const handleSaveScenario = () => {
    if (scenarioName && jobOffer.title && investments.length > 0) {
      const newScenario = createScenario(scenarioName, jobOffer as JobOffer, investments)
      router.push(`/dashboard/scenarios/${newScenario.id}`)
    }
  }

  const steps = [
    { number: 1, title: "Job Offer", description: "Upload or enter job details" },
    { number: 2, title: "Investments", description: "Plan your investment strategy" },
    { number: 3, title: "Review", description: "Name and save your scenario" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <div className="w-px h-6 bg-border"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">New Scenario</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSaveScenario}
                disabled={!scenarioName || !jobOffer.title || investments.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Scenario
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Scenario</h1>
          <p className="text-muted-foreground">
            Build a complete financial scenario by adding a job offer and investment strategy.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-4 ${
                      currentStep > step.number ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step 1: Job Offer */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex justify-center space-x-4 mb-6">
                <Button
                  variant={!isManualEntry ? "default" : "outline"}
                  onClick={() => setIsManualEntry(false)}
                  className={!isManualEntry ? "bg-primary hover:bg-primary/90" : "bg-transparent"}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
                <Button
                  variant={isManualEntry ? "default" : "outline"}
                  onClick={() => setIsManualEntry(true)}
                  className={isManualEntry ? "bg-primary hover:bg-primary/90" : "bg-transparent"}
                >
                  Manual Entry
                </Button>
              </div>

              {!isManualEntry ? (
                <FileUpload onFileProcessed={handleFileProcessed} maxFiles={1} />
              ) : (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Enter Job Details</CardTitle>
                    <CardDescription>Manually enter your job offer information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={jobOffer.company || ""}
                          onChange={(e) => setJobOffer({ ...jobOffer, company: e.target.value })}
                          placeholder="TechCorp Inc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                          id="title"
                          value={jobOffer.title || ""}
                          onChange={(e) => setJobOffer({ ...jobOffer, title: e.target.value })}
                          placeholder="Senior Software Engineer"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary">Annual Salary</Label>
                        <Input
                          id="salary"
                          type="number"
                          value={jobOffer.salary || ""}
                          onChange={(e) => setJobOffer({ ...jobOffer, salary: Number(e.target.value) })}
                          placeholder="150000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={jobOffer.location || ""}
                          onChange={(e) => setJobOffer({ ...jobOffer, location: e.target.value })}
                          placeholder="San Francisco, CA"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleManualJobEntry}
                      disabled={!jobOffer.title || !jobOffer.company || !jobOffer.salary || !jobOffer.location}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Continue to Investments
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Investments */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{jobOffer.company}</p>
                      <p className="text-sm text-muted-foreground">
                        {jobOffer.title} • ${jobOffer.salary?.toLocaleString()} • {jobOffer.location}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <InvestmentForm
                onInvestmentsChange={handleInvestmentsChange}
                monthlyBudget={Math.floor((jobOffer.salary || 0) * 0.72 / 12) - 4000} // Rough take-home minus expenses
              />

              <div className="flex justify-center">
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={investments.length === 0}
                  className="bg-primary hover:bg-primary/90"
                >
                  Continue to Review
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Name Your Scenario</CardTitle>
                  <CardDescription>Give your scenario a memorable name for easy comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="scenarioName">Scenario Name</Label>
                    <Input
                      id="scenarioName"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder={`${jobOffer.company} ${jobOffer.location?.split(",")[1]?.trim() || ""}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Job Offer Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company</span>
                      <span className="font-medium text-foreground">{jobOffer.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position</span>
                      <span className="font-medium text-foreground">{jobOffer.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salary</span>
                      <span className="font-medium text-foreground">${jobOffer.salary?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-foreground">{jobOffer.location}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Investment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Investment</span>
                      <span className="font-medium text-foreground">
                        ${investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Number of ETFs</span>
                      <span className="font-medium text-foreground">{investments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Investment</span>
                      <span className="font-medium text-foreground">
                        ${(investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0) * 12).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
