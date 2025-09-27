/**
 * Conversation context management for Gemini chat interactions
 * Maintains conversation history and context for coherent follow-up questions
 */

import type { ExtractedData } from '@/types/analysis'
import type { FinancialAnalysis, ConversationalResponse } from '@/lib/gemini'

/**
 * Message types in the conversation
 */
export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    type?: 'question' | 'analysis' | 'clarification' | 'error'
    confidence?: number
    dataPoints?: Array<{ label: string; value: string }>
    relatedTopics?: string[]
  }
}

/**
 * Conversation context that persists across messages
 */
export interface ConversationContext {
  sessionId: string
  userId?: string
  startTime: Date
  lastActivity: Date
  extractedData: ExtractedData
  financialAnalysis?: FinancialAnalysis
  messages: ConversationMessage[]
  topics: Set<string>
  userPreferences?: {
    priorities?: string[]
    constraints?: Record<string, any>
    goals?: string[]
  }
  metadata?: {
    documentId?: string
    companyName?: string
    position?: string
    analysisType?: string
  }
}

/**
 * Manages conversation state and context
 */
export class ConversationManager {
  private contexts: Map<string, ConversationContext> = new Map()
  private maxHistoryLength: number = 20
  private contextTimeout: number = 30 * 60 * 1000 // 30 minutes

  /**
   * Initialize a new conversation context
   */
  initializeContext(
    sessionId: string,
    extractedData: ExtractedData,
    userId?: string,
    metadata?: ConversationContext['metadata']
  ): ConversationContext {
    const context: ConversationContext = {
      sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      extractedData,
      messages: [],
      topics: new Set(),
      metadata,
    }

    // Add initial system message for context
    this.addMessage(sessionId, {
      role: 'system',
      content: `Analyzing job offer from ${extractedData.company} for position: ${extractedData.jobTitle}`,
      metadata: { type: 'analysis' },
    })

    this.contexts.set(sessionId, context)
    return context
  }

  /**
   * Get or create a conversation context
   */
  getContext(sessionId: string): ConversationContext | null {
    const context = this.contexts.get(sessionId)
    
    if (!context) {
      return null
    }

    // Check if context has expired
    const now = Date.now()
    const lastActivity = context.lastActivity.getTime()
    
    if (now - lastActivity > this.contextTimeout) {
      this.contexts.delete(sessionId)
      return null
    }

    // Update last activity
    context.lastActivity = new Date()
    return context
  }

  /**
   * Add a message to the conversation
   */
  addMessage(
    sessionId: string,
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ): ConversationMessage | null {
    const context = this.getContext(sessionId)
    
    if (!context) {
      return null
    }

    const fullMessage: ConversationMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
    }

    context.messages.push(fullMessage)

    // Extract topics from the message
    this.extractTopics(fullMessage.content).forEach(topic => {
      context.topics.add(topic)
    })

    // Trim history if it gets too long
    if (context.messages.length > this.maxHistoryLength) {
      // Keep system messages and recent messages
      const systemMessages = context.messages.filter(m => m.role === 'system')
      const recentMessages = context.messages.slice(-this.maxHistoryLength)
      context.messages = [...systemMessages, ...recentMessages]
    }

    return fullMessage
  }

  /**
   * Update financial analysis in context
   */
  updateAnalysis(
    sessionId: string,
    analysis: FinancialAnalysis
  ): boolean {
    const context = this.getContext(sessionId)
    
    if (!context) {
      return false
    }

    context.financialAnalysis = analysis
    
    // Add analysis summary as a system message
    this.addMessage(sessionId, {
      role: 'system',
      content: `Financial analysis completed: ${analysis.summary}`,
      metadata: {
        type: 'analysis',
        dataPoints: analysis.comparisonPoints.map(p => ({
          label: p.factor,
          value: p.value,
        })),
      },
    })

    return true
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(
    sessionId: string,
    preferences: Partial<ConversationContext['userPreferences']>
  ): boolean {
    const context = this.getContext(sessionId)
    
    if (!context) {
      return false
    }

    context.userPreferences = {
      ...context.userPreferences,
      ...preferences,
    }

    return true
  }

  /**
   * Get conversation summary for context window
   */
  getConversationSummary(
    sessionId: string,
    maxMessages: number = 10
  ): {
    recentMessages: ConversationMessage[]
    topics: string[]
    summary: string
  } | null {
    const context = this.getContext(sessionId)
    
    if (!context) {
      return null
    }

    // Get recent messages, excluding system messages for summary
    const recentMessages = context.messages
      .filter(m => m.role !== 'system')
      .slice(-maxMessages)

    // Generate summary
    const summary = this.generateSummary(context)

    return {
      recentMessages,
      topics: Array.from(context.topics),
      summary,
    }
  }

  /**
   * Build context string for AI prompts
   */
  buildContextString(sessionId: string): string {
    const context = this.getContext(sessionId)
    
    if (!context) {
      return ''
    }

    const parts: string[] = []

    // Add job details
    parts.push(`Job Details:
- Company: ${context.extractedData.company}
- Position: ${context.extractedData.jobTitle}
- Salary: $${context.extractedData.baseSalary}
- Location: ${context.extractedData.location}`)

    // Add financial analysis if available
    if (context.financialAnalysis) {
      parts.push(`\nPrevious Analysis:
${context.financialAnalysis.summary}`)

      // Add key insights
      const insights = context.financialAnalysis.keyInsights
        .slice(0, 3)
        .map(i => `- ${i.insight}`)
        .join('\n')
      
      if (insights) {
        parts.push(`\nKey Insights:\n${insights}`)
      }
    }

    // Add user preferences if available
    if (context.userPreferences) {
      if (context.userPreferences.priorities?.length) {
        parts.push(`\nUser Priorities: ${context.userPreferences.priorities.join(', ')}`)
      }
      if (context.userPreferences.goals?.length) {
        parts.push(`User Goals: ${context.userPreferences.goals.join(', ')}`)
      }
    }

    // Add recent conversation history
    const recentExchanges = this.getRecentExchanges(context, 3)
    if (recentExchanges.length > 0) {
      parts.push('\nRecent Conversation:')
      recentExchanges.forEach(exchange => {
        parts.push(`User: ${exchange.question}`)
        parts.push(`Assistant: ${exchange.answer.substring(0, 200)}...`)
      })
    }

    // Add topics discussed
    if (context.topics.size > 0) {
      parts.push(`\nTopics Discussed: ${Array.from(context.topics).join(', ')}`)
    }

    return parts.join('\n')
  }

  /**
   * Get recent question-answer pairs
   */
  private getRecentExchanges(
    context: ConversationContext,
    limit: number = 5
  ): Array<{ question: string; answer: string }> {
    const exchanges: Array<{ question: string; answer: string }> = []
    const messages = context.messages.filter(m => m.role !== 'system')

    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        exchanges.push({
          question: messages[i].content,
          answer: messages[i + 1].content,
        })
      }
    }

    return exchanges.slice(-limit)
  }

  /**
   * Extract topics from message content
   */
  private extractTopics(content: string): string[] {
    const topics: string[] = []
    const topicKeywords = {
      salary: ['salary', 'compensation', 'pay', 'wage', 'income'],
      benefits: ['benefits', 'insurance', '401k', 'pto', 'vacation'],
      location: ['location', 'remote', 'relocation', 'commute', 'city'],
      growth: ['growth', 'career', 'promotion', 'advancement', 'development'],
      negotiation: ['negotiate', 'counter', 'offer', 'ask', 'request'],
      comparison: ['compare', 'versus', 'better', 'choose', 'decision'],
      taxes: ['tax', 'deduction', 'withholding', 'take-home'],
      savings: ['save', 'savings', 'investment', 'retirement', 'budget'],
    }

    const lowerContent = content.toLowerCase()
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        topics.push(topic)
      }
    }

    return topics
  }

  /**
   * Generate a summary of the conversation
   */
  private generateSummary(context: ConversationContext): string {
    const parts: string[] = []

    // Basic info
    parts.push(`Discussing ${context.extractedData.jobTitle} position at ${context.extractedData.company}`)

    // Topics covered
    if (context.topics.size > 0) {
      parts.push(`Topics covered: ${Array.from(context.topics).join(', ')}`)
    }

    // Message count
    const userMessages = context.messages.filter(m => m.role === 'user').length
    parts.push(`${userMessages} questions asked`)

    // Duration
    const duration = Date.now() - context.startTime.getTime()
    const minutes = Math.floor(duration / 60000)
    if (minutes > 0) {
      parts.push(`${minutes} minute conversation`)
    }

    return parts.join('. ')
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up expired contexts
   */
  cleanupExpiredContexts(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [sessionId, context] of this.contexts.entries()) {
      if (now - context.lastActivity.getTime() > this.contextTimeout) {
        this.contexts.delete(sessionId)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Export conversation for analysis or storage
   */
  exportConversation(sessionId: string): object | null {
    const context = this.getContext(sessionId)
    
    if (!context) {
      return null
    }

    return {
      sessionId: context.sessionId,
      userId: context.userId,
      startTime: context.startTime.toISOString(),
      lastActivity: context.lastActivity.toISOString(),
      duration: Date.now() - context.startTime.getTime(),
      jobDetails: {
        company: context.extractedData.company,
        position: context.extractedData.jobTitle,
        salary: context.extractedData.baseSalary,
        location: context.extractedData.location,
      },
      messageCount: context.messages.length,
      topics: Array.from(context.topics),
      messages: context.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        metadata: m.metadata,
      })),
      userPreferences: context.userPreferences,
      metadata: context.metadata,
    }
  }

  /**
   * Get statistics about all active conversations
   */
  getStatistics(): {
    activeConversations: number
    totalMessages: number
    averageMessageCount: number
    popularTopics: Array<{ topic: string; count: number }>
  } {
    const topicCounts = new Map<string, number>()
    let totalMessages = 0

    for (const context of this.contexts.values()) {
      totalMessages += context.messages.length
      
      for (const topic of context.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      }
    }

    const popularTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      activeConversations: this.contexts.size,
      totalMessages,
      averageMessageCount: this.contexts.size > 0 
        ? Math.round(totalMessages / this.contexts.size) 
        : 0,
      popularTopics,
    }
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager()

/**
 * React hook for managing conversation state
 */
export function useConversation(
  sessionId: string,
  extractedData: ExtractedData,
  userId?: string
) {
  const context = conversationManager.getContext(sessionId) ||
    conversationManager.initializeContext(sessionId, extractedData, userId)

  return {
    context,
    addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) =>
      conversationManager.addMessage(sessionId, message),
    updateAnalysis: (analysis: FinancialAnalysis) =>
      conversationManager.updateAnalysis(sessionId, analysis),
    updatePreferences: (preferences: Partial<ConversationContext['userPreferences']>) =>
      conversationManager.updateUserPreferences(sessionId, preferences),
    getSummary: () => conversationManager.getConversationSummary(sessionId),
    getContextString: () => conversationManager.buildContextString(sessionId),
    exportConversation: () => conversationManager.exportConversation(sessionId),
  }
}
