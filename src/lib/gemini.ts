import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { z } from 'zod'
import type { ExtractedData } from '@/types/analysis'

/**
 * Configuration for Google Gemini API client
 */
const GEMINI_CONFIG = {
  model: 'gemini-2.5-flash', // Stable model for financial analysis
  temperature: 0.7, // Balanced creativity for analysis
  maxOutputTokens: 4096,
  topP: 0.95,
  topK: 40,
}

/**
 * Safety settings to ensure appropriate content generation
 */
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

/**
 * Schema for financial analysis response
 */
const financialAnalysisSchema = z.object({
  summary: z.string().describe('Brief overview of the financial implications'),
  keyInsights: z.array(z.object({
    category: z.enum(['compensation', 'benefits', 'growth', 'location', 'worklife']),
    insight: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
  })).describe('Key insights from the analysis'),
  monthlyBreakdown: z.object({
    grossIncome: z.number(),
    estimatedTaxes: z.number(),
    netIncome: z.number(),
    estimatedExpenses: z.number().optional(),
    savingsPotential: z.number().optional(),
  }).describe('Monthly financial breakdown'),
  recommendations: z.array(z.string()).describe('Actionable recommendations'),
  comparisonPoints: z.array(z.object({
    factor: z.string(),
    value: z.string(),
    benchmark: z.string().optional(),
  })).describe('Key comparison points for decision making'),
})

/**
 * Schema for conversational response
 */
const conversationalResponseSchema = z.object({
  answer: z.string().describe('Direct answer to the user question'),
  supportingData: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional().describe('Supporting data points if relevant'),
  followUpQuestions: z.array(z.string()).describe('Suggested follow-up questions'),
})

export type FinancialAnalysis = z.infer<typeof financialAnalysisSchema>
export type ConversationalResponse = z.infer<typeof conversationalResponseSchema>

/**
 * Google Gemini API client for financial analysis
 */
export class GeminiClient {
  private model: ChatGoogleGenerativeAI

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY
    
    if (!apiKey) {
      throw new Error('Google Gemini API key is not configured. Please set GOOGLE_GEMINI_API_KEY in your environment variables.')
    }

    this.model = new ChatGoogleGenerativeAI({
      apiKey,
      model: GEMINI_CONFIG.model,
      temperature: GEMINI_CONFIG.temperature,
      maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
      topP: GEMINI_CONFIG.topP,
      topK: GEMINI_CONFIG.topK,
      safetySettings: SAFETY_SETTINGS as any, // Type casting due to library mismatch
    })
  }

  /**
   * Analyze job offer data for financial insights
   */
  async analyzeJobOffer(
    extractedData: ExtractedData,
    context?: {
      currentSalary?: number
      location?: string
      experienceLevel?: string
    }
  ): Promise<FinancialAnalysis> {
    const structuredModel = this.model.withStructuredOutput(financialAnalysisSchema, {
      name: 'financial_analysis',
    })

    const prompt = this.buildAnalysisPrompt(extractedData, context)
    
    try {
      console.log('🤖 Initiating Gemini financial analysis...')
      const result = await structuredModel.invoke([['human', prompt]])
      console.log('✅ Gemini analysis complete')
      return result as FinancialAnalysis
    } catch (error) {
      console.error('❌ Gemini analysis failed:', error)
      throw new Error('Failed to analyze job offer with Gemini')
    }
  }

  /**
   * Handle conversational follow-up questions about the analysis
   */
  async answerQuestion(
    question: string,
    extractedData: ExtractedData,
    financialAnalysis: any,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    contextChunks?: string[]
  ): Promise<ConversationalResponse> {
    console.log('🧠 Invoking Gemini for conversational follow-up...')
    
    // Create a structured output model
    const structuredModel = this.model.withStructuredOutput(conversationalResponseSchema)

    // Build the conversational prompt
    const prompt = this.buildConversationalPrompt(
      question,
      extractedData,
      financialAnalysis,
      history,
      contextChunks
    )

    try {
      console.log('🤖 Processing follow-up question with Gemini...')
      
      // Use the structured output model to ensure the response matches our schema
      const result = await structuredModel.invoke(prompt)
      
      console.log('✅ Gemini response generated')
      console.log('Response structure:', Object.keys(result).join(', '))
      
      return result
    } catch (error) {
      console.error('❌ Gemini conversation failed:', error)
      
      // Provide a fallback response if the model fails
      return {
        answer: "I'm sorry, I couldn't process your question at this time. Please try again or ask a different question.",
        followUpQuestions: [
          "Could you rephrase your question?",
          "Would you like to know about the salary details instead?",
          "Should we discuss the benefits package?"
        ]
      }
    }
  }

  /**
   * Compare multiple job offers
   */
  async compareOffers(
    offers: ExtractedData[],
    criteria?: {
      priorities?: Array<'salary' | 'benefits' | 'location' | 'growth' | 'worklife'>
      constraints?: Record<string, any>
    }
  ): Promise<{
    recommendation: string
    comparison: Array<{
      company: string
      pros: string[]
      cons: string[]
      score: number
    }>
    rationale: string
  }> {
    const comparisonSchema = z.object({
      recommendation: z.string(),
      comparison: z.array(z.object({
        company: z.string(),
        pros: z.array(z.string()),
        cons: z.array(z.string()),
        score: z.number().min(0).max(100),
      })),
      rationale: z.string(),
    })

    const structuredModel = this.model.withStructuredOutput(comparisonSchema, {
      name: 'offer_comparison',
    })

    const prompt = this.buildComparisonPrompt(offers, criteria)

    try {
      console.log('🤖 Comparing job offers with Gemini...')
      const result = await structuredModel.invoke([['human', prompt]])
      console.log('✅ Comparison analysis complete')
      return result as any
    } catch (error) {
      console.error('❌ Gemini comparison failed:', error)
      throw new Error('Failed to compare offers with Gemini')
    }
  }

  /**
   * Build analysis prompt for job offer
   */
  private buildAnalysisPrompt(
    data: ExtractedData,
    context?: Record<string, any>
  ): string {
    return `You are an expert financial advisor specializing in career decisions and compensation analysis.

Analyze this job offer and provide comprehensive financial insights:

Company: ${data.company}
Position: ${data.jobTitle}
Base Salary: $${data.baseSalary}
Location: ${data.location}
Benefits: ${data.benefits?.join(', ') || 'Not specified'}
Start Date: ${data.startDate || 'Not specified'}

${context ? `Additional Context:
${context.currentSalary ? `Current Salary: $${context.currentSalary}` : ''}
${context.location ? `Current Location: ${context.location}` : ''}
${context.experienceLevel ? `Experience Level: ${context.experienceLevel}` : ''}` : ''}

Please provide:
1. A comprehensive financial analysis of this offer
2. Monthly budget breakdown with realistic estimates
3. Key insights categorized by type (compensation, benefits, etc.)
4. Actionable recommendations for negotiation or decision-making
5. Comparison points against market standards

Consider factors like:
- Cost of living in the location
- Tax implications
- Career growth potential
- Work-life balance indicators
- Total compensation value including benefits`
  }

  /**
   * Build conversational prompt for follow-up questions
   */
  private buildConversationalPrompt(
    question: string,
    data: ExtractedData,
    financialAnalysis: any,
    history?: Array<{ role: string; content: string }>,
    contextChunks?: string[]
  ): string {
    let prompt = `You are a helpful financial advisor assistant. You have previously analyzed a job offer with the following details:

Company: ${data.company}
Position: ${data.jobTitle}
Base Salary: $${data.baseSalary}
Location: ${data.location}
Benefits: ${data.benefits?.join(', ') || 'Not specified'}

${financialAnalysis ? `Previous Analysis Summary: ${financialAnalysis.summary}` : ''}`

    if (history && history.length > 0) {
      prompt += '\n\nConversation History:\n'
      history.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`
      })
    }

    prompt += `\n\nUser Question: ${question}

You must respond in the following JSON format:
{
  "answer": "A clear, direct answer to the question",
  "supportingData": [
    {"label": "Data Point Label 1", "value": "Data Point Value 1"},
    {"label": "Data Point Label 2", "value": "Data Point Value 2"}
  ],
  "followUpQuestions": [
    "Suggested follow-up question 1?",
    "Suggested follow-up question 2?",
    "Suggested follow-up question 3?"
  ]
}

The answer should be comprehensive but conversational. The supportingData array can be empty if there are no relevant data points.

Be concise but thorough. Focus on practical, actionable insights.`

    return prompt
  }

  /**
   * Build comparison prompt for multiple offers
   */
  private buildComparisonPrompt(
    offers: ExtractedData[],
    criteria?: Record<string, any>
  ): string {
    const offersText = offers.map((offer, i) => `
Offer ${i + 1}:
Company: ${offer.company}
Position: ${offer.jobTitle}
Base Salary: $${offer.baseSalary}
Location: ${offer.location}
Benefits: ${offer.benefits?.join(', ') || 'Not specified'}
`).join('\n')

    return `You are an expert career advisor helping someone choose between multiple job offers.

Compare these offers:
${offersText}

${criteria?.priorities ? `User's priorities (in order): ${criteria.priorities.join(', ')}` : ''}
${criteria?.constraints ? `Constraints: ${JSON.stringify(criteria.constraints)}` : ''}

Please provide:
1. A clear recommendation on which offer to accept
2. Detailed pros and cons for each offer
3. A score (0-100) for each offer based on overall value
4. A comprehensive rationale explaining your recommendation

Consider all aspects:
- Total compensation (salary + benefits value)
- Career growth potential
- Work-life balance
- Location factors (cost of living, quality of life)
- Company stability and culture
- Long-term financial impact`
  }

  /**
   * Generate scenario projections for financial planning
   */
  async generateProjections(
    data: ExtractedData,
    years: number = 5
  ): Promise<{
    projections: Array<{
      year: number
      salary: number
      savings: number
      netWorth: number
    }>
    assumptions: string[]
    insights: string[]
  }> {
    const projectionSchema = z.object({
      projections: z.array(z.object({
        year: z.number(),
        salary: z.number(),
        savings: z.number(),
        netWorth: z.number(),
      })),
      assumptions: z.array(z.string()),
      insights: z.array(z.string()),
    })

    const structuredModel = this.model.withStructuredOutput(projectionSchema, {
      name: 'financial_projections',
    })

    const prompt = `Generate ${years}-year financial projections for this job offer:

Company: ${data.company}
Starting Salary: $${data.baseSalary}
Location: ${data.location}
Benefits: ${data.benefits?.join(', ') || 'Not specified'}

Create realistic projections considering:
- Annual salary increases (industry standard)
- Savings rate based on location cost of living
- Investment returns (conservative 7% annual)
- Inflation impact
- Career progression typical for this role

Provide year-by-year projections and list all assumptions made.`

    try {
      console.log('🤖 Generating financial projections with Gemini...')
      const result = await structuredModel.invoke([['human', prompt]])
      console.log('✅ Projections generated successfully')
      return result as any
    } catch (error) {
      console.error('❌ Projection generation failed:', error)
      throw new Error('Failed to generate projections with Gemini')
    }
  }
}

// Export singleton instance
let geminiClient: GeminiClient | null = null

export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    geminiClient = new GeminiClient()
  }
  return geminiClient
}
