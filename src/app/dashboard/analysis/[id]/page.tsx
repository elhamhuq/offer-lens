"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import FileUploadRAG from "@/components/FileUploadRAG"
import AnalysisResults from "@/components/AnalysisResults"
import AnalysisChat from "@/components/AnalysisChat"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("results")

  useEffect(() => {
    if (analysisId && analysisId !== 'new') {
      // Immediately check status on load
      checkAnalysisStatus()

      const poller = setInterval(() => {
        if (analysisStatus === 'completed' || analysisStatus === 'failed') {
          clearInterval(poller)
          return
        }
        checkAnalysisStatus()
      }, 3000)

      return () => clearInterval(poller)
    } else {
      setIsLoading(false)
    }
  }, [analysisId])

  useEffect(() => {
    // When status becomes 'completed', fetch the full results
    if (analysisStatus === 'completed' && !analysisData) {
      console.log('🔄 Status is completed, fetching full results')
      fetchResults()
    }
  }, [analysisStatus])

  const fetchResults = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/analysis/${analysisId}/results`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch results')
      }
      const data = await response.json()
      setAnalysisData(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching results:", err)
      setError(err instanceof Error ? err.message : "Failed to load analysis results")
    } finally {
      setIsLoading(false)
    }
  }

  const checkAnalysisStatus = async () => {
    try {
      // Don't set loading state here to avoid UI flicker during polling
      const response = await fetch(`/api/analysis/${analysisId}/status`)
      const data = await response.json()

      setAnalysisStatus(data.status)

      if (data.status === 'failed') {
        setError(data.errorMessage || "Analysis failed to process")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error checking status:", err)
      setError("Failed to get analysis status")
      setIsLoading(false)
    }
  }

  const handleAnalysisComplete = (newAnalysisId: string, data: any) => {
    // Navigate to the new analysis page
    router.push(`/dashboard/analysis/${newAnalysisId}`)
  }

  const handleDataUpdate = async (updatedData: any) => {
    // Reload the analysis data after update
    await fetchResults()
  }

  const handleExport = async (format: 'json' | 'markdown') => {
    try {
      const response = await fetch(`/api/analysis/${analysisId}/export?format=${format}`)
      if (!response.ok) throw new Error("Export failed")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analysis-${analysisId}.${format === 'json' ? 'json' : 'md'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Export error:", err)
    }
  }

  // Show upload interface for new analysis
  if (analysisId === 'new' || !analysisId) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
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
            <h1 className="text-2xl font-bold">New Analysis</h1>
          </div>
        </div>

        <FileUploadRAG onAnalysisComplete={handleAnalysisComplete} />
      </div>
    )
  }

  // Loading state
  if (isLoading && !analysisData) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
            <p className="text-gray-600">Loading analysis...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !analysisData) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="text-center">
          <Button onClick={() => router.push('/dashboard/analysis/new')}>
            Start New Analysis
          </Button>
        </div>
      </div>
    )
  }

  // Main analysis view
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
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
              {analysisData?.extractedData?.company || "Job Analysis"}
            </h1>
            <p className="text-gray-600">
              {analysisData?.extractedData?.jobTitle || "Position"} • {analysisData?.filename}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('markdown')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Share functionality
              navigator.clipboard.writeText(window.location.href)
              alert("Link copied to clipboard!")
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Processing Warning */}
      {error && analysisData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="results" className="gap-2">
            <FileText className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-6">
          {analysisData && (
            <AnalysisResults
              analysisId={analysisId}
              extractedData={analysisData.extractedData}
              confidenceScores={analysisData.confidenceScores}
              financialAnalysis={analysisData.financialAnalysis}
              onUpdate={handleDataUpdate}
              onChat={() => setActiveTab("chat")}
            />
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData?.formattedAnalysis ? (
                <div className="prose prose-sm max-w-none">
                  {/* Render formatted analysis */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Summary</h3>
                      <p className="text-gray-600">
                        {analysisData.formattedAnalysis.summary}
                      </p>
                    </div>

                    {analysisData.formattedAnalysis.insights?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                        <div className="space-y-2">
                          {analysisData.formattedAnalysis.insights.map((insight: any, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <span>{insight.icon}</span>
                              <div>
                                <p className="font-medium">{insight.title}</p>
                                <p className="text-sm text-gray-600">{insight.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisData.formattedAnalysis.metrics?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Key Metrics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {analysisData.formattedAnalysis.metrics.map((metric: any, i: number) => (
                            <div key={i} className="border rounded-lg p-3">
                              <p className="text-xs text-gray-500">{metric.label}</p>
                              <p className="text-lg font-semibold">{metric.value}</p>
                              {metric.description && (
                                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No insights available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <AnalysisChat
            analysisId={analysisId}
            companyName={analysisData?.extractedData?.company}
            position={analysisData?.extractedData?.jobTitle}
            isChatEnabled={analysisStatus === 'completed'}
          />
        </TabsContent>
      </Tabs>

      {/* Metadata */}
      {analysisData?.metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Analysis Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">File Size</p>
                <p className="font-medium">
                  {(analysisData.metadata.fileSize / 1024).toFixed(2)} KB
                </p>
              </div>
              <div>
                <p className="text-gray-500">Processing Time</p>
                <p className="font-medium">
                  {analysisData.metadata.processingTime}s
                </p>
              </div>
              <div>
                <p className="text-gray-500">Embeddings</p>
                <p className="font-medium">
                  {analysisData.metadata.embeddingCount} chunks
                </p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">
                  {new Date(analysisData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
