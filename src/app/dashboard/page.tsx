"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Save,
  TrendingUp,
  Plus,
  Calendar,
  DollarSign,
  MapPin,
  FolderOpen,
  Sparkles,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Target,
  Briefcase,
  ArrowUpRight,
  Building2,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useScenario } from "@/hooks/useScenario"
import { useStore } from "@/store/useStore"
import FileUploadRAG from "@/components/FileUploadRAG"
import InvestmentForm from "@/components/InvestmentForm"
import type { JobOffer, Investment } from "@/types"

export default function DashboardPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState("scenarios")

  // New scenario state
  const [scenarioName, setScenarioName] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [jobOffer, setJobOffer] = useState<Partial<JobOffer>>({})
  const [investments, setInvestments] = useState<Investment[]>([])
  const [monthlyExpenses, setMonthlyExpenses] = useState(4000)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Edit scenario state
  const [editingScenario, setEditingScenario] = useState<string | null>(null)
  const [editScenarioName, setEditScenarioName] = useState("")
  const [editJobOffer, setEditJobOffer] = useState<Partial<JobOffer>>({})
  const [editInvestments, setEditInvestments] = useState<Investment[]>([])

  // Scenario loading state
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true)
  const [scenarioError, setScenarioError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const { createScenario, deleteScenario, updateCurrentScenario } = useScenario()
  const { scenarios, addScenario, currentScenario, setCurrentScenario, isAuthenticated, loadScenarios } = useStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle notification from URL parameters
  useEffect(() => {
    const created = searchParams.get("created")
    if (created === "true") {
      setNotification("Scenario created successfully from analysis!")
      setTimeout(() => setNotification(null), 5000)

      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete("created")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  // Handle edit parameter from URL
  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId && scenarios.length > 0) {
      const scenarioToEdit = scenarios.find((s) => s.id === editId)
      if (scenarioToEdit && !editingScenario) {
        handleEditScenario(scenarioToEdit)
      }
    }
  }, [searchParams, scenarios])

  // Load scenarios when component mounts
  useEffect(() => {
    const initializeScenarios = async () => {
      if (isAuthenticated) {
        try {
          setIsLoadingScenarios(true)
          setScenarioError(null)
          console.log("📋 Dashboard loading scenarios...")
          await loadScenarios()
          console.log("✅ Scenarios loaded successfully")
        } catch (error) {
          console.error("❌ Error loading scenarios:", error)
          setScenarioError("Failed to load scenarios. Please try refreshing the page.")
        } finally {
          setIsLoadingScenarios(false)
        }
      } else {
        setIsLoadingScenarios(false)
      }
    }

    initializeScenarios()
  }, [isAuthenticated, loadScenarios])

  // Refresh scenarios function
  const handleRefreshScenarios = async () => {
    try {
      setIsLoadingScenarios(true)
      setScenarioError(null)
      await loadScenarios()
    } catch (error) {
      console.error("Error refreshing scenarios:", error)
      setScenarioError("Failed to refresh scenarios.")
    } finally {
      setIsLoadingScenarios(false)
    }
  }

  const handleManualJobEntry = () => {
    const currentJobOffer = editingScenario ? editJobOffer : jobOffer
    if (currentJobOffer.title && currentJobOffer.company && currentJobOffer.salary && currentJobOffer.location) {
      setCurrentStep(2)
    }
  }

  const handleInvestmentsChange = (newInvestments: Investment[]) => {
    if (editingScenario) {
      setEditInvestments(newInvestments)
    } else {
      setInvestments(newInvestments)
    }
  }

  const handleSaveScenario = async () => {
    if (scenarioName && jobOffer.title && investments.length > 0) {
      setIsSaving(true)
      setSaveError(null)

      try {
        const newScenario = await createScenario(scenarioName, jobOffer as JobOffer, investments)

        if (newScenario) {
          // Show success message
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 3000)

          // Reset form and switch to scenarios tab
          setScenarioName("")
          setCurrentStep(1)
          setJobOffer({})
          setInvestments([])
          setActiveTab("scenarios")
        } else {
          setSaveError("Failed to create scenario. Please try again.")
        }
      } catch (error) {
        console.error("Error creating scenario:", error)
        setSaveError("An error occurred while saving the scenario. Please try again.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Edit scenario functions
  const handleEditScenario = (scenario: any) => {
    setEditingScenario(scenario.id)
    setEditScenarioName(scenario.name)
    setEditJobOffer(scenario.jobOffer)
    setEditInvestments(scenario.investments)
    setActiveTab("create")
    setCurrentStep(1)
  }

  const handleSaveEdit = async () => {
    if (!editingScenario || !editScenarioName || !editJobOffer.title || editInvestments.length === 0) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      // Set the current scenario to the one being edited
      const scenarioToEdit = scenarios.find((s) => s.id === editingScenario)
      if (scenarioToEdit) {
        setCurrentScenario(scenarioToEdit)

        // Update the scenario
        await updateCurrentScenario({
          name: editScenarioName,
          jobOffer: editJobOffer as JobOffer,
          investments: editInvestments,
        })

        // Show success message
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)

        // Reset edit state and switch to scenarios tab
        setEditingScenario(null)
        setEditScenarioName("")
        setEditJobOffer({})
        setEditInvestments([])
        setActiveTab("scenarios")
      }
    } catch (error) {
      console.error("Error updating scenario:", error)
      setSaveError("An error occurred while updating the scenario. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewDetails = (scenario: any) => {
    // Navigate to a detailed view or show a modal
    router.push(`/dashboard/scenario/${scenario.id}`)
  }

  const handleDeleteScenario = async (scenarioId: string) => {
    if (confirm("Are you sure you want to delete this scenario? This action cannot be undone.")) {
      try {
        setSaveError(null)

        const success = await deleteScenario(scenarioId)

        if (!success) {
          setSaveError("Failed to delete scenario. Please try again.")
        } else {
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 3000)
        }
      } catch (error) {
        console.error("Error deleting scenario:", error)
        setSaveError("An error occurred while deleting the scenario.")
      }
    }
  }

  const steps = [
    {
      number: 1,
      title: "Job Offer",
      description: "Upload or enter job details",
    },
    {
      number: 2,
      title: "Investments",
      description: "Plan your investment strategy",
    },
    { number: 3, title: "Review", description: "Name and save your scenario" },
  ]

  const tabs = [
    { id: "scenarios", label: "Scenarios", icon: FolderOpen },
    { id: "create", label: "Create New", icon: Plus },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your scenarios and create new ones to compare job offers and investment strategies.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <Alert className="mb-6 bg-gradient-to-r from-green-50 to-green-50/50 border-green-200/60 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">{notification}</AlertDescription>
        </Alert>
      )}

      {scenarioError && (
        <Alert className="mb-6 bg-gradient-to-r from-red-50 to-red-50/50 border-red-200/60 shadow-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            {scenarioError}
            <Button
              variant="link"
              className="h-auto p-0 text-red-600 underline ml-2 hover:text-red-700"
              onClick={handleRefreshScenarios}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gradient-to-r from-muted/40 to-muted/60 p-1.5 rounded-xl w-fit border border-border/50 shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "scenarios" && (
        <div>
          {isLoadingScenarios ? (
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/60 shadow-xl">
              <CardContent className="py-16 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-10 h-10 text-primary animate-bounce" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Loading scenarios...</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto text-lg">
                    Fetching your scenarios from the database.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : scenarios.length === 0 ? (
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/60 shadow-xl">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-muted/40 to-muted/60 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No scenarios yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                  Create your first scenario to start comparing job offers and investment strategies.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6 py-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Scenario
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefreshScenarios}
                    className="border-border/60 hover:bg-muted/50 px-6 py-3 bg-transparent"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {/* Scenarios header with refresh */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Your Scenarios</p>
                    <p className="text-muted-foreground">
                      {scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""} found
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshScenarios}
                  disabled={isLoadingScenarios}
                  className="border-border/60 hover:bg-muted/50 bg-transparent"
                >
                  {isLoadingScenarios ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>

              <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
  {scenarios.map(scenario => (
    <Card
      key={scenario.id}
      className='bg-gradient-to-br from-card to-card/80 border-border/80 hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 group shadow-lg shadow-black/10'
    >
      <CardHeader className='pb-4'>
        <div className='flex items-start justify-between'>
          <div className='space-y-3 flex-1'>
            {/* Prominent Title */}

            <div className='flex items-center space-x-3'>
              <div className='p-2.5 bg-primary/10 rounded-xl flex-shrink-0'>
                <Building2 className='w-5 h-5 text-primary' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-bold text-lg text-foreground truncate leading-tight'>
                  {scenario.jobOffer.company}
                </p>
                <p className='text-sm text-muted-foreground/90 truncate mt-0.5'>
                  {scenario.jobOffer.title}
                </p>
              </div>
          </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className='space-y-5'>
        {/* Company and Job Details - Better Structured */}
        
          
          {/* Salary and Location - Better Layout */}
          <div className='grid grid-cols-1 gap-3 pl-2'>
            <div className='flex items-center space-x-3'>
              <DollarSign className='w-4 h-4 text-green-600 flex-shrink-0' />
              <div>
                <p className='text-lg font-bold text-foreground'>
                  ${scenario.jobOffer.salary.toLocaleString()}
                </p>
                <p className='text-xs text-muted-foreground'>Annual Salary</p>
              </div>
            </div>
            
            <div className='flex items-center space-x-3'>
              <MapPin className='w-4 h-4 text-blue-600 flex-shrink-0' />
              <div>
                <p className='font-medium text-foreground'>
                  {scenario.jobOffer.location}
                </p>
                <p className='text-xs text-muted-foreground'>Location</p>
              </div>
            </div>
          </div>

        {/* Investment Summary - More Prominent */}
        <div className='pt-4 border-t border-border/60'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center space-x-2'>
              <Target className='w-4 h-4 text-purple-600' />
              <span className='font-bold text-foreground'>Investment Strategy</span>
            </div>
            <Badge variant='secondary' className='bg-purple-50 text-purple-700 border-purple-200 font-medium'>
              {scenario.investments.length} ETFs
            </Badge>
          </div>
          
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>Monthly Investment:</span>
              <span className='font-bold text-lg text-foreground'>
                $
                {scenario.investments
                  .reduce((sum: number, inv: Investment) => sum + inv.monthlyAmount, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>Annual Investment:</span>
              <span className='font-semibold text-muted-foreground'>
                $
                {(scenario.investments
                  .reduce((sum: number, inv: Investment) => sum + inv.monthlyAmount, 0) * 12)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Better Spacing */}
        <div className='pt-4 border-t border-border/60'>
          <div className='flex space-x-2'>
            <Button
              size='sm'
              variant='outline'
              className='flex-1 border-border/70 hover:bg-muted/70 bg-card/50 text-sm font-medium hover:border-primary/50'
              onClick={() => handleViewDetails(scenario)}
            >
              View Details
            </Button>
            <Button
              size='sm'
              className='flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 text-sm font-medium'
              onClick={() => handleEditScenario(scenario)}
            >
              <Edit className='w-3 h-3 mr-1' />
              Edit
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='border-red-200/80 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 bg-card/50 px-3'
              onClick={() => handleDeleteScenario(scenario.id)}
            >
              <Trash2 className='w-3.5 h-3.5' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

            </div>
          )}
        </div>
      )}

      {activeTab === "create" && (
  <div>
    
          {/* AI Analysis Section - Single clean card */}
    <div className="mb-12">
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/60 shadow-xl">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  AI-Powered Document Analysis
                </CardTitle>
                <CardDescription className="text-lg">
                  Upload job offers for instant AI analysis with Google Gemini, or create manually below
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => router.push("/dashboard/analysis/new")}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <FileUploadRAG
            onAnalysisComplete={(analysisId, data) => {
              router.push(`/dashboard/analysis/${analysisId}`)
            }}
          />
        </CardContent>
      </Card>
    </div>

          {/* Divider between AI analysis and manual creation */}
    <div className="flex items-center my-12">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      <div className="px-6 py-3 bg-gradient-to-r from-muted/40 to-muted/60 rounded-full border border-border/50">
        <span className="text-sm font-medium text-muted-foreground">OR CREATE MANUALLY</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
    </div>

          {/* Progress Steps */}
    <div className="mb-10">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  currentStep >= step.number
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-gradient-to-r from-muted/60 to-muted/80 text-muted-foreground"
                }`}
              >
                {step.number}
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-6 rounded-full transition-all duration-300 ${
                  currentStep > step.number ? "bg-gradient-to-r from-primary to-primary/90" : "bg-border"
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
                <Card className="bg-gradient-to-br from-card to-card/80 border-border/60 shadow-xl">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <span>Enter Job Details</span>
                    </CardTitle>
                    <CardDescription className="text-base">
                      Manually enter your job offer information to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={editingScenario ? editJobOffer.company || "" : jobOffer.company || ""}
                          onChange={(e) => {
                            if (editingScenario) {
                              setEditJobOffer({
                                ...editJobOffer,
                                company: e.target.value,
                              })
                            } else {
                              setJobOffer({
                                ...jobOffer,
                                company: e.target.value,
                              })
                            }
                          }}
                          placeholder="TechCorp Inc."
                          className="border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                          id="title"
                          value={editingScenario ? editJobOffer.title || "" : jobOffer.title || ""}
                          onChange={(e) => {
                            if (editingScenario) {
                              setEditJobOffer({
                                ...editJobOffer,
                                title: e.target.value,
                              })
                            } else {
                              setJobOffer({
                                ...jobOffer,
                                title: e.target.value,
                              })
                            }
                          }}
                          placeholder="Senior Software Engineer"
                          className="border-border/50"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary">Annual Salary</Label>
                        <Input
                          id="salary"
                          type="number"
                          value={editingScenario ? editJobOffer.salary || "" : jobOffer.salary || ""}
                          onChange={(e) => {
                            if (editingScenario) {
                              setEditJobOffer({
                                ...editJobOffer,
                                salary: Number(e.target.value),
                              })
                            } else {
                              setJobOffer({
                                ...jobOffer,
                                salary: Number(e.target.value),
                              })
                            }
                          }}
                          placeholder="150000"
                          className="border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editingScenario ? editJobOffer.location || "" : jobOffer.location || ""}
                          onChange={(e) => {
                            if (editingScenario) {
                              setEditJobOffer({
                                ...editJobOffer,
                                location: e.target.value,
                              })
                            } else {
                              setJobOffer({
                                ...jobOffer,
                                location: e.target.value,
                              })
                            }
                          }}
                          placeholder="San Francisco, CA"
                          className="border-border/50"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleManualJobEntry}
                      disabled={
                        editingScenario
                          ? !editJobOffer.title ||
                            !editJobOffer.company ||
                            !editJobOffer.salary ||
                            !editJobOffer.location
                          : !jobOffer.title || !jobOffer.company || !jobOffer.salary || !jobOffer.location
                      }
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] py-3"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Continue to Investments
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Investments */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {editingScenario ? editJobOffer.company : jobOffer.company}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {editingScenario ? editJobOffer.title : jobOffer.title} • $
                          {(editingScenario ? editJobOffer.salary : jobOffer.salary)?.toLocaleString()} •{" "}
                          {editingScenario ? editJobOffer.location : jobOffer.location}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="hover:bg-muted/50">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <span>Estimate Monthly Expenses</span>
                    </CardTitle>
                    <CardDescription className="text-base">
                      Provide an estimate of your monthly expenses to calculate your investment budget.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyExpenses">Monthly Expenses ($)</Label>
                      <Input
                        id="monthlyExpenses"
                        type="number"
                        value={monthlyExpenses}
                        onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                        placeholder="e.g., 4000"
                        className="border-border/50"
                      />
                    </div>
                  </CardContent>
                </Card>

                <InvestmentForm
                  onInvestmentsChange={handleInvestmentsChange}
                  monthlyBudget={
                    Math.floor((((editingScenario ? editJobOffer.salary : jobOffer.salary) || 0) * 0.7) / 12) -
                    monthlyExpenses
                  } // Using 70% take-home pay estimate
                />

                <div className="flex justify-center">
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={(editingScenario ? editInvestments.length : investments.length) === 0}
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-3 px-8"
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
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <span>Name Your Scenario</span>
                    </CardTitle>
                    <CardDescription className="text-base">
                      Give your scenario a memorable name for easy comparison
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="scenarioName">Scenario Name</Label>
                      <Input
                        id="scenarioName"
                        value={editingScenario ? editScenarioName : scenarioName}
                        onChange={(e) => {
                          if (editingScenario) {
                            setEditScenarioName(e.target.value)
                          } else {
                            setScenarioName(e.target.value)
                          }
                        }}
                        placeholder={`${editingScenario ? editJobOffer.company : jobOffer.company} ${
                          (editingScenario ? editJobOffer.location : jobOffer.location)?.split(",")[1]?.trim() || ""
                        }`}
                        className="border-border/50"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-card to-card/80 border-border/60 shadow-lg">
                    <CardHeader className="border-b border-border/50">
                      <CardTitle className="text-lg flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <span>Job Offer Summary</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Company</span>
                        <span className="font-medium text-foreground">
                          {editingScenario ? editJobOffer.company : jobOffer.company}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Position</span>
                        <span className="font-medium text-foreground">
                          {editingScenario ? editJobOffer.title : jobOffer.title}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Salary</span>
                        <span className="font-medium text-foreground">
                          ${(editingScenario ? editJobOffer.salary : jobOffer.salary)?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium text-foreground">
                          {editingScenario ? editJobOffer.location : jobOffer.location}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-card to-card/80 border-border/60 shadow-lg">
                    <CardHeader className="border-b border-border/50">
                      <CardTitle className="text-lg flex items-center space-x-3">
                        <div className="p-2 bg-chart-2/10 rounded-lg">
                          <Target className="w-5 h-5 text-chart-2" />
                        </div>
                        <span>Investment Summary</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Investment</span>
                        <span className="font-medium text-foreground">
                          $
                          {(editingScenario ? editInvestments : investments)
                            .reduce((sum: number, inv: Investment) => sum + inv.monthlyAmount, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Number of ETFs</span>
                        <span className="font-medium text-foreground">
                          {editingScenario ? editInvestments.length : investments.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Annual Investment</span>
                        <span className="font-medium text-foreground">
                          $
                          {(
                            (editingScenario ? editInvestments : investments).reduce(
                              (sum: number, inv: Investment) => sum + inv.monthlyAmount,
                              0,
                            ) * 12
                          ).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
