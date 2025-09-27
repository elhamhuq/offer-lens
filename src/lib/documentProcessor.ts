import { Document } from "langchain/document"
import pdf from "pdf-parse"

export interface ProcessingProgress {
  stage: 'uploading' | 'parsing' | 'chunking' | 'embedding' | 'extracting' | 'analyzing' | 'completed'
  progress: number // 0-100
  message: string
}

export interface ProcessingError {
  code: string
  message: string
  details?: any
}

export class DocumentProcessor {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = ['application/pdf']
  private static readonly MAX_PAGES = 50

  /**
   * Validates the uploaded file for security and format requirements
   */
  static validateFile(file: File): ProcessingError | null {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        code: 'FILE_TOO_LARGE',
        message: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${this.MAX_FILE_SIZE / 1024 / 1024}MB)`
      }
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        code: 'INVALID_FILE_TYPE',
        message: `File type '${file.type}' is not supported. Only PDF files are allowed.`
      }
    }

    // Check filename
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return {
        code: 'INVALID_EXTENSION',
        message: 'File must have a .pdf extension'
      }
    }

    return null
  }

  /**
   * Extracts text content from a PDF file
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer()
      const data = await pdf(Buffer.from(buffer))
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in PDF')
      }

      // Check if PDF has too many pages
      if (data.numpages > this.MAX_PAGES) {
        throw new Error(`PDF has ${data.numpages} pages, which exceeds the maximum allowed (${this.MAX_PAGES})`)
      }

      return data.text
    } catch (error) {
      console.error('PDF parsing error:', error)
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Chunks text into sentences for better processing
   */
  static chunkTextIntoSentences(text: string): string[] {
    // Clean the text first
    const cleanedText = this.cleanText(text)
    
    // Split by sentence endings, but be careful with abbreviations
    const sentences = cleanedText
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 10) // Filter out very short fragments
    
    return sentences
  }

  /**
   * Cleans and normalizes text content
   */
  static cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere with processing
      .replace(/[^\w\s.,!?;:()$-]/g, '')
      // Normalize currency symbols
      .replace(/[$£€¥]/g, '$')
      // Remove page numbers and headers/footers (basic patterns)
      .replace(/^\d+\s*$/gm, '')
      .replace(/Page \d+ of \d+/gi, '')
      // Trim whitespace
      .trim()
  }

  /**
   * Creates LangChain Document objects from text chunks
   */
  static createDocumentsFromChunks(
    chunks: string[], 
    metadata: {
      filename: string
      userId: string
      documentAnalysisId: string
      [key: string]: any
    }
  ): Document[] {
    return chunks.map((chunk, index) => ({
      pageContent: chunk,
      metadata: {
        ...metadata,
        chunkIndex: index,
        chunkLength: chunk.length,
        timestamp: new Date().toISOString()
      }
    }))
  }

  /**
   * Validates extracted text quality
   */
  static validateExtractedText(text: string): ProcessingError | null {
    if (!text || text.trim().length < 100) {
      return {
        code: 'INSUFFICIENT_TEXT',
        message: 'PDF contains insufficient text content for analysis'
      }
    }

    // Check for common job offer keywords
    const jobOfferKeywords = [
      'salary', 'compensation', 'benefits', 'position', 'role', 'company',
      'employment', 'offer', 'hire', 'job', 'work', 'location', 'start date'
    ]
    
    const hasJobOfferContent = jobOfferKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    )

    if (!hasJobOfferContent) {
      return {
        code: 'NOT_JOB_OFFER',
        message: 'PDF does not appear to contain job offer content'
      }
    }

    return null
  }

  /**
   * Estimates processing time based on file characteristics
   */
  static estimateProcessingTime(fileSize: number, textLength: number): number {
    // Base processing time in seconds
    let estimatedTime = 30
    
    // Add time based on file size (1 second per MB)
    estimatedTime += Math.ceil(fileSize / 1024 / 1024)
    
    // Add time based on text length (1 second per 1000 characters)
    estimatedTime += Math.ceil(textLength / 1000)
    
    // Cap at 5 minutes
    return Math.min(estimatedTime, 300)
  }

  /**
   * Processes a complete PDF file and returns structured data
   */
  static async processPDF(
    file: File,
    metadata: {
      userId: string
      documentAnalysisId: string
    },
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<{
    text: string
    chunks: string[]
    documents: Document[]
    estimatedTime: number
  }> {
    // Validate file
    const validationError = this.validateFile(file)
    if (validationError) {
      throw new Error(validationError.message)
    }

    onProgress?.({
      stage: 'parsing',
      progress: 10,
      message: 'Extracting text from PDF...'
    })

    // Extract text
    const text = await this.extractTextFromPDF(file)
    
    onProgress?.({
      stage: 'parsing',
      progress: 30,
      message: 'Validating extracted content...'
    })

    // Validate text quality
    const textValidationError = this.validateExtractedText(text)
    if (textValidationError) {
      throw new Error(textValidationError.message)
    }

    onProgress?.({
      stage: 'chunking',
      progress: 50,
      message: 'Chunking text into sentences...'
    })

    // Chunk text
    const chunks = this.chunkTextIntoSentences(text)
    
    onProgress?.({
      stage: 'chunking',
      progress: 70,
      message: 'Creating document objects...'
    })

    // Create LangChain documents
    const documents = this.createDocumentsFromChunks(chunks, {
      filename: file.name,
      userId: metadata.userId,
      documentAnalysisId: metadata.documentAnalysisId,
      fileSize: file.size,
      extractedAt: new Date().toISOString()
    })

    const estimatedTime = this.estimateProcessingTime(file.size, text.length)

    onProgress?.({
      stage: 'completed',
      progress: 100,
      message: 'PDF processing completed successfully'
    })

    return {
      text,
      chunks,
      documents,
      estimatedTime
    }
  }
}

export default DocumentProcessor
