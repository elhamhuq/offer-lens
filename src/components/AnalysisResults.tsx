"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  DollarSign,
  MapPin,
  Briefcase,
  Calendar,
  Gift,
  Edit2,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  Info,
  Building,
  Sparkles
} from "lucide-react"

interface ExtractedData {
  company: string
  jobTitle: string
  baseSalary: number
  location: string
  benefits?: string[]
  startDate?: string
  reportingStructure?: string
  additionalInfo?: string
}

interface FinancialAnalysis {
  summary: string
  keyInsights: Array<{
    category: string
    insight: string
    impact: 'positive' | 'negative' | 'neutral'
  }>
  monthlyBreakdown: {
    grossIncome: number
    estimatedTaxes: number
    netIncome: number
    estimatedExpenses?: number
    savingsPotential?: number
  }
  recommendations: string[]
  comparisonPoints: Array<{
    factor: string
    value: string
    benchmark?: string
  }>
}

interface AnalysisResultsProps {
  analysisId: string
  extractedData: ExtractedData
  confidenceScores?: Record<string, number>
  financialAnalysis?: FinancialAnalysis
  onUpdate?: (updatedData: Partial<ExtractedData>) => Promise<void>
  onChat?: () => void
}

export default function AnalysisResults({
  analysisId,
  extractedData,
  confidenceScores = {},
  financialAnalysis,
  onUpdate,
  onChat
}: AnalysisResultsProps) {
  // Early return if data is not loaded yet
  if (!extractedData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Loading Analysis Results...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState(extractedData)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!onUpdate) return
    
    setIsSaving(true)
    setSaveError(null)
    
    try {
      // Call the API to update the data
      const response = await fetch(`/api/analysis/${analysisId}/extracted-data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      })

      if (!response.ok) {
        throw new Error('Failed to update data')
      }

      await onUpdate(editedData)
      setIsEditing(false)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData(extractedData)
    setIsEditing(false)
    setSaveError(null)
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score >= 0.6) return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <AlertCircle className="h-4 w-4 text-red-600" />
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Extracted Data Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Extracted Information
              </CardTitle>
              <CardDescription>
                AI-extracted data from your job offer with confidence scores
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {saveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company
                {getConfidenceIcon(confidenceScores.company || 0)}
              </Label>
              {isEditing ? (
                <Input
                  value={editedData.company}
                  onChange={(e) => setEditedData({ ...editedData, company: e.target.value })}
                />
              ) : (
                <p className="text-lg font-medium">{extractedData.company}</p>
              )}
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Position
                {getConfidenceIcon(confidenceScores.jobTitle || 0)}
              </Label>
              {isEditing ? (
                <Input
                  value={editedData.jobTitle}
                  onChange={(e) => setEditedData({ ...editedData, jobTitle: e.target.value })}
                />
              ) : (
                <p className="text-lg font-medium">{extractedData.jobTitle}</p>
              )}
            </div>

            {/* Salary */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Base Salary
                {getConfidenceIcon(confidenceScores.baseSalary || 0)}
              </Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.baseSalary}
                  onChange={(e) => setEditedData({ ...editedData, baseSalary: Number(e.target.value) })}
                />
              ) : (
                <p className="text-lg font-medium">{formatCurrency(extractedData.baseSalary)}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
                {getConfidenceIcon(confidenceScores.location || 0)}
              </Label>
              {isEditing ? (
                <Input
                  value={editedData.location}
                  onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                />
              ) : (
                <p className="text-lg font-medium">{extractedData.location}</p>
              )}
            </div>

            {/* Start Date */}
            {extractedData.startDate && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date
                  {getConfidenceIcon(confidenceScores.startDate || 0)}
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedData.startDate}
                    onChange={(e) => setEditedData({ ...editedData, startDate: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-medium">{extractedData.startDate}</p>
                )}
              </div>
            )}

            {/* Benefits */}
            {extractedData.benefits && extractedData.benefits.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Benefits
                  {getConfidenceIcon(confidenceScores.benefits || 0)}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {extractedData.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Analysis Card */}
      {financialAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Financial Analysis
            </CardTitle>
            <CardDescription>
              {financialAnalysis.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Insights */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Key Insights</h3>
              <div className="space-y-2">
                {financialAnalysis.keyInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    {getImpactIcon(insight.impact)}
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{insight.category}</p>
                      <p className="text-sm text-gray-600">{insight.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Monthly Breakdown */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Monthly Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Gross Income</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(financialAnalysis.monthlyBreakdown.grossIncome)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Est. Taxes</p>
                  <p className="text-lg font-semibold text-red-600">
                    -{formatCurrency(financialAnalysis.monthlyBreakdown.estimatedTaxes)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Net Income</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(financialAnalysis.monthlyBreakdown.netIncome)}
                  </p>
                </div>
                {financialAnalysis.monthlyBreakdown.estimatedExpenses && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Est. Expenses</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(financialAnalysis.monthlyBreakdown.estimatedExpenses)}
                    </p>
                  </div>
                )}
                {financialAnalysis.monthlyBreakdown.savingsPotential && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Savings Potential</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(financialAnalysis.monthlyBreakdown.savingsPotential)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Recommendations */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Recommendations</h3>
              <div className="space-y-2">
                {financialAnalysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-gray-600">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Points */}
            {financialAnalysis.comparisonPoints.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-700">Market Comparison</h3>
                  <div className="space-y-2">
                    {financialAnalysis.comparisonPoints.map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{point.factor}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{point.value}</span>
                          {point.benchmark && (
                            <>
                              <span className="text-xs text-gray-500">vs</span>
                              <span className="text-sm text-gray-600">{point.benchmark}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Chat Button */}
            {onChat && (
              <div className="pt-4">
                <Button onClick={onChat} className="w-full" variant="outline">
                  <Info className="h-4 w-4 mr-2" />
                  Ask Follow-up Questions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
