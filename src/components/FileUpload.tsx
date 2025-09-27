"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { supabase } from "@/lib/supabase"
import { useStore } from "@/store/useStore"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  extractedData?: {
    company: string
    jobTitle: string
    baseSalary: number
    location: string
    benefits: string[]
  }
  documentAnalysisId?: string
  error?: string
}

interface FileUploadProps {
  onFileProcessed?: (data: UploadedFile["extractedData"]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export default function FileUpload({
  onFileProcessed,
  maxFiles = 3,
  acceptedTypes = [".pdf", ".txt", ".doc", ".docx"],
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { user, addScenario } = useStore()

  const processPDFFile = async (file: File, fileId: string) => {
    try {
      // Update status to processing
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "processing" } : f)))

      // Create FormData for the API call
      const formData = new FormData()
      formData.append('file', file)

      // Make sure we have a valid session with cookies
      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log('FileUpload - Session check:', session ? `User ${session.user.id}` : 'No session')

      if (!session) {
        // Check if user is logged in via store
        if (!user) {
          throw new Error('No active session found. Please log in again.')
        }
        console.log('Using user from store:', user.id)
      } else {
        console.log('Using session for user:', session.user.id)
      }

      // Call our PDF processing API (cookies will be sent automatically)
      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Important! This ensures cookies are sent
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Processing failed')
      }

      // Extract the data from the response
      const extractedData = result.extractedData
      const documentAnalysisId = result.documentAnalysisId

      // Update file status to completed
      setFiles((prev) =>
        prev.map((f) => 
          f.id === fileId 
            ? { 
                ...f, 
                status: "completed", 
                extractedData,
                documentAnalysisId 
              } 
            : f
        )
      )

      // Add scenario to store for comparison
      if (extractedData && addScenario) {
        const scenario = {
          id: documentAnalysisId || Math.random().toString(36).substr(2, 9),
          name: `${extractedData.company} - ${extractedData.jobTitle}`,
          jobOffer: {
            id: documentAnalysisId || Math.random().toString(36).substr(2, 9),
            title: extractedData.jobTitle,
            company: extractedData.company,
            salary: extractedData.baseSalary,
            location: extractedData.location,
            benefits: extractedData.benefits,
            uploadedAt: new Date(),
          },
          investments: [], // Will be added by user later
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        addScenario(scenario)
      }

      // Call the callback if provided
      if (onFileProcessed) {
        onFileProcessed(extractedData)
      }

    } catch (error) {
      console.error('PDF processing error:', error)
      
      // Update file status to error
      setFiles((prev) =>
        prev.map((f) => 
          f.id === fileId 
            ? { 
                ...f, 
                status: "error", 
                error: error instanceof Error ? error.message : 'Processing failed'
              } 
            : f
        )
      )
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check if user is logged in
      if (!user) {
        alert('Please log in to upload files')
        return
      }

      // Verify we have a valid session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Your session has expired. Please log in again.')
        return
      }

      console.log('Session user ID:', session.user.id)
      console.log('Store user ID:', user.id)

      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
      }))

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles))

      // Process each file
      newFiles.forEach((fileObj) => {
        // Update to uploading status
        setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: "uploading" } : f)))
        
        // Start processing
        processPDFFile(acceptedFiles.find(f => f.name === fileObj.name)!, fileObj.id)
      })
    },
    [maxFiles, onFileProcessed, user, addScenario],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles,
    disabled: files.length >= maxFiles,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-accent" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-chart-4" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />
      default:
        return <File className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading..."
      case "processing":
        return "Extracting data..."
      case "completed":
        return "Ready"
      case "error":
        return "Failed"
      default:
        return "Pending"
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-primary" />
          <span>Upload Job Offers</span>
        </CardTitle>
        <CardDescription>
          Upload PDF or text files containing job offers. Our AI will extract salary, benefits, and location data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
            ${files.length >= maxFiles ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-sm text-muted-foreground">or click to browse ({maxFiles - files.length} remaining)</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              {acceptedTypes.map((type) => (
                <span key={type} className="px-2 py-1 bg-muted rounded">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Uploaded Files</h4>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(file.status)}
                    <div>
                      <p className="font-medium text-foreground text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {getStatusText(file.status)}
                        {file.error && (
                          <span className="block text-red-500 mt-1">{file.error}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Data Preview */}
        {files.some((f) => f.status === "completed" && f.extractedData) && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Extracted Information</h4>
            {files
              .filter((f) => f.status === "completed" && f.extractedData)
              .map((file) => (
                <Card key={file.id} className="bg-accent/5 border-accent/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Company</p>
                        <p className="text-sm text-muted-foreground">{file.extractedData?.company}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Position</p>
                        <p className="text-sm text-muted-foreground">{file.extractedData?.jobTitle}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Salary</p>
                        <p className="text-sm text-muted-foreground">${file.extractedData?.baseSalary.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">{file.extractedData?.location}</p>
                      </div>
                    </div>
                    {file.extractedData?.benefits && file.extractedData.benefits.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Benefits</p>
                        <div className="flex flex-wrap gap-1">
                          {file.extractedData.benefits.map((benefit, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Help Text */}
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Tip:</strong> For best results, upload clear PDF files or well-formatted text documents. Our AI can
            extract salary, benefits, location, and other key details automatically.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
