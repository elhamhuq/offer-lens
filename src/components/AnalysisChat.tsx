"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  Loader2,
  ChevronDown,
  MessageSquare,
  TrendingUp,
  DollarSign,
  MapPin,
  Briefcase,
  AlertCircle,
  RefreshCw
} from "lucide-react"

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  dataPoints?: Array<{ label: string; value: string }>
  suggestions?: string[]
  isLoading?: boolean
}

interface AnalysisChatProps {
  analysisId: string
  companyName?: string
  position?: string
  onClose?: () => void
  isChatEnabled: boolean
}

export default function AnalysisChat({
  analysisId,
  companyName = "this company",
  position = "this position",
  onClose,
  isChatEnabled
}: AnalysisChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([
    "How does this salary compare to market rates?",
    "What are the tax implications in this location?",
    "Should I negotiate for a higher salary?",
    "What's the total compensation value including benefits?",
    "How much can I save monthly with this salary?"
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory()
  }, [analysisId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/analysis/${analysisId}/chat`)
      if (response.ok) {
        const data = await response.json()
        if (data.conversation?.messages) {
          const formattedMessages = data.conversation.messages.map((msg: any) => ({
            id: msg.id || Math.random().toString(36).substring(7),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            dataPoints: msg.metadata?.dataPoints,
            suggestions: msg.metadata?.followUpQuestions
          }))
          setMessages(formattedMessages)
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
    }
  }

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    // Add loading message
    const loadingMessage: Message = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      const response = await fetch(`/api/analysis/${analysisId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            includeAnalysis: true,
            includeHistory: true,
            maxHistoryMessages: 10
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      // Remove loading message and add actual response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'loading')
        return [...filtered, {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: data.response.message,
          timestamp: new Date(data.response.timestamp),
          dataPoints: data.response.dataPoints,
          suggestions: data.response.suggestions
        }]
      })

      // Update suggestions if provided
      if (data.response.suggestions?.length > 0) {
        setSuggestions(data.response.suggestions)
      }

    } catch (error) {
      console.error("Chat error:", error)
      setError(error instanceof Error ? error.message : "Failed to send message")
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== 'loading'))
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = async () => {
    try {
      await fetch(`/api/analysis/${analysisId}/chat`, {
        method: 'DELETE'
      })
      setMessages([])
      setSuggestions([
        "How does this salary compare to market rates?",
        "What are the tax implications in this location?",
        "Should I negotiate for a higher salary?",
        "What's the total compensation value including benefits?",
        "How much can I save monthly with this salary?"
      ])
    } catch (error) {
      console.error("Failed to clear chat:", error)
    }
  }

  const formatTimestamp = (date: Date) => {
    try {
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Just now'
      }
      
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date)
    } catch (error) {
      console.error('Invalid date:', date)
      return 'Just now'
    }
  }

  const getDataPointIcon = (label: string) => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes('salary') || lowerLabel.includes('pay')) {
      return <DollarSign className="h-3 w-3" />
    }
    if (lowerLabel.includes('location')) {
      return <MapPin className="h-3 w-3" />
    }
    if (lowerLabel.includes('role') || lowerLabel.includes('position')) {
      return <Briefcase className="h-3 w-3" />
    }
    return <TrendingUp className="h-3 w-3" />
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              AI Financial Advisor
            </CardTitle>
            <CardDescription>
              Ask questions about {position} at {companyName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              disabled={messages.length === 0 || isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="p-4 bg-purple-100 rounded-full">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">
                  {isChatEnabled ? "Hi! I'm your AI Financial Advisor" : "AI Advisor is initializing..."}
                </h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  {isChatEnabled 
                    ? "I can help you understand the financial implications of this job offer, compare it to market rates, and provide negotiation strategies."
                    : "Please wait for the initial analysis to complete. The chat will be enabled automatically."}
                </p>
              </div>
              {!isChatEnabled && <Loader2 className="h-5 w-5 animate-spin" />}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Sparkles className="h-3 w-3" />
                Powered by Google Gemini
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] space-y-2 ${
                      message.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Analyzing...</span>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>

                    {/* Data Points */}
                    {message.dataPoints && message.dataPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.dataPoints.map((point, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 bg-white border rounded-md"
                          >
                            {getDataPointIcon(point.label)}
                            <span className="text-xs font-medium">{point.label}:</span>
                            <span className="text-xs">{point.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <span className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-gray-200 rounded-full">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && messages.length === 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(suggestion)}
                  className="text-xs"
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="px-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isChatEnabled ? "Ask about salary, benefits, negotiations..." : "Waiting for analysis to complete..."}
              disabled={isLoading || !isChatEnabled}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isLoading || !isChatEnabled}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
