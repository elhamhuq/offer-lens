"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Brain,
  Sparkles,
  Clock,
  AlertTriangle
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useStore } from "@/store/useStore"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "idle" | "uploading" | "processing" | "completed" | "failed"
  analysisId?: string
  progress?: {
    overall: number
    stages: {
      upload?: { percentage: number; status: string }
      extraction?: { percentage: number; status: string }
      embedding?: { percentage: number; status: string }
      analysis?: { percentage: number; status: string }
      storage?: { percentage: number; status: string }
    }
  }
  extractedData?: any
  financialAnalysis?: any
  error?: string
  processingTime?: number
}

interface FileUploadRAGProps {
  onAnalysisComplete?: (analysisId: string, data: any) => void
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
}

export default function FileUploadRAG({
  onAnalysisComplete,
  maxFileSize = 10,
  acceptedTypes = [".pdf"],
}: FileUploadRAGProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useStore()

  // Poll for status updates
  const pollStatus = useCallback(async (analysisId: string, fileId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/${analysisId}/status`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch status')
        }

        const data = await response.json()
        
        // Update file with progress
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                progress: data.progress,
                status: data.isFailed ? 'failed' : data.isComplete ? 'completed' : 'processing',
                error: data.errorMessage,
                processingTime: data.estimatedTimeRemaining
              } 
            : f
        ))

        // Stop polling if complete or failed
        if (data.isComplete || data.isFailed) {
          clearInterval(pollInterval)
          
          if (data.isComplete) {
            // Fetch full results
            const resultsResponse = await fetch(`/api/analysis/${analysisId}/results`)
            if (resultsResponse.ok) {
              const results = await resultsResponse.json()
              
              setFiles(prev => prev.map(f => 
                f.id === fileId 
                  ? { 
                      ...f, 
                      extractedData: results.extractedData,
                      financialAnalysis: results.financialAnalysis
                    } 
                  : f
              ))

              onAnalysisComplete?.(analysisId, results)
            }
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Clean up interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000)
  }, [onAnalysisComplete])

  const processFile = async (file: File, fileId: string) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'uploading' } : f
      ))

      // Create FormData for the API call
      const formData = new FormData()
      formData.append('file', file)
      formData.append('metadata', JSON.stringify({
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }))

      // Upload and start analysis
      const response = await fetch('/api/upload/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      
      // Update file with analysis ID
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'processing', analysisId: data.analysisId } 
          : f
      ))

      // Start polling for status
      pollStatus(data.analysisId, fileId)

    } catch (error) {
      console.error('File processing error:', error)
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Processing failed' 
            } 
          : f
      ))
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'idle' as const,
      }))

      setFiles(prev => [...prev, ...newFiles])
      setIsProcessing(true)

      // Process each file
      for (let index = 0; index < acceptedFiles.length; index++) {
        await processFile(acceptedFiles[index], newFiles[index].id)
      }

      setIsProcessing(false)
    },
    []
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': acceptedTypes,
    },
    maxSize: maxFileSize * 1024 * 1024,
    maxFiles: files.length >= 3 ? 0 : 3 - files.length,
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 animate-pulse" />
      case 'processing':
        return <Brain className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = (file: UploadedFile): number => {
    if (!file.progress) return 0
    return file.progress.overall || 0
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI-Powered Document Analysis
        </CardTitle>
        <CardDescription>
          Upload job offer PDFs for instant AI analysis with financial insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${isDragActive 
              ? 'border-purple-500 bg-purple-50 scale-[1.02]' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} disabled={isProcessing} />
          
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Upload className="h-8 w-8 text-purple-600" />
            </div>
            
            {isDragActive ? (
              <div className="space-y-1">
                <p className="text-lg font-medium text-purple-600">Drop your PDF here</p>
                <p className="text-sm text-gray-500">We'll analyze it instantly</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-lg font-medium text-gray-700">
                  Drag & drop your job offer PDF
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse • Max {maxFileSize}MB
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">PDF</Badge>
              <Badge variant="secondary">AI Analysis</Badge>
              <Badge variant="secondary">Financial Insights</Badge>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Processing Queue
            </h3>
            
            {files.map((file) => (
              <div
                key={file.id}
                className="relative bg-white border rounded-lg p-4 space-y-3"
              >
                {/* File Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(file.status)}>
                      {file.status}
                    </Badge>
                    {file.status !== 'processing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status === 'processing' && file.progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Processing...</span>
                      <span>{getProgressPercentage(file)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500 ease-out"
                        style={{ width: `${getProgressPercentage(file)}%` }}
                      />
                    </div>
                    
                    {/* Stage Indicators */}
                    <div className="flex gap-1 mt-2">
                      {Object.entries(file.progress.stages).map(([stage, data]) => (
                        <div
                          key={stage}
                          className={`flex-1 h-1 rounded-full ${
                            data.status === 'completed' 
                              ? 'bg-green-500' 
                              : data.status === 'processing' 
                              ? 'bg-blue-500 animate-pulse' 
                              : 'bg-gray-300'
                          }`}
                          title={stage}
                        />
                      ))}
                    </div>
                    
                    {file.processingTime && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Est. {file.processingTime}s remaining
                      </p>
                    )}
                  </div>
                )}

                {/* Extracted Data Preview */}
                {file.status === 'completed' && file.extractedData && (
                  <div className="bg-green-50 rounded-md p-3 space-y-2">
                    <p className="text-sm font-medium text-green-900">
                      ✨ Analysis Complete
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Company:</span>{' '}
                        <span className="font-medium">{file.extractedData.company}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Position:</span>{' '}
                        <span className="font-medium">{file.extractedData.jobTitle}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Salary:</span>{' '}
                        <span className="font-medium">
                          ${file.extractedData.baseSalary?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>{' '}
                        <span className="font-medium">{file.extractedData.location}</span>
                      </div>
                    </div>
                    {file.analysisId && (
                      <Button 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => window.location.href = `/dashboard/analysis/${file.analysisId}`}
                      >
                        View Full Analysis →
                      </Button>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {file.status === 'failed' && file.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Processing Failed</AlertTitle>
                    <AlertDescription>{file.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        {files.length === 0 && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertTitle>AI-Powered Analysis</AlertTitle>
            <AlertDescription>
              Our AI extracts key information from job offers and provides comprehensive 
              financial analysis, salary comparisons, and negotiation insights powered by 
              Google Gemini.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
