// app/api/gemini/investment-suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { financialAnalysis } = await request.json()

    if (!financialAnalysis) {
      return NextResponse.json(
        { error: 'Financial analysis is required' },
        { status: 400 }
      )
    }

    // Try different model names - use the current available models
    const modelNames = [
      "gemini-2.0-flash",     // Latest stable model
      "gemini-2.5-flash",     // Alternative
      "gemini-1.5-pro",       // Fallback
      "gemini-pro"            // Basic fallback
    ]

    let model = null
    let modelUsed = ''

    // Try each model until we find one that works
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName })
        modelUsed = modelName
        break
      } catch (err) {
        console.warn(`Model ${modelName} not available, trying next...`)
        continue
      }
    }

    if (!model) {
      throw new Error('No available Gemini models found')
    }

    const prompt = `Based on this financial analysis of a job offer, provide 3 investment strategy suggestions:

Financial Analysis:
- Monthly Net Income: $${financialAnalysis.monthlyBreakdown?.netIncome || 'N/A'}
- Monthly Savings Potential: $${financialAnalysis.monthlyBreakdown?.savingsPotential || 'N/A'}
- Monthly Estimated Expenses: $${financialAnalysis.monthlyBreakdown?.estimatedExpenses || 'N/A'}
- Annual Gross Income: $${(financialAnalysis.monthlyBreakdown?.grossIncome * 12) || 'N/A'}

Key Insights:
${financialAnalysis.keyInsights?.map((insight: any) => `- ${insight.category}: ${insight.insight}`).join('\n') || 'No insights available'}

Recommendations from analysis:
${financialAnalysis.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || 'No recommendations available'}

Please provide exactly 3 investment strategy suggestions:
1. Conservative approach (lower risk, steady growth)
2. Moderate approach (balanced risk/reward)  
3. Aggressive approach (higher risk, higher potential returns)

For each suggestion, include:
- A realistic monthly dollar amount to invest (based on their savings potential)
- Brief reasoning (2-3 sentences explaining why this amount makes sense for their situation)
- Risk level (Conservative, Moderate, or Aggressive)

Return ONLY a valid JSON array with this exact format:
[
  {
    "investmentRate": 0.15,
    "monthlyAmount": This must be calculated based on the current scenarios saving amounts and budget,
    "reasoning": "{This must be based on your own judgement for this relevant risklevel, hard limit 200 characters. Suggest 1-3 Investment Companies (Think AAPL, MSFT, Tesla and ETC)}.",
    "riskLevel": "Conservative"
  },
  {
    "investmentRate": 0.20,
    "monthlyAmount": This must be calculated based on the current scenarios saving amounts and budget,
    "reasoning": "{This must be based on your own judgement for this relevant risklevel, hard limit 200 characters. Suggest 1-3 Investment Companies (Think AAPL, MSFT, Tesla and ETC)}.",
    "riskLevel": "Moderate"
  },
  {
    "investmentRate": 0.25,
    "monthlyAmount": This must be calculated based on the current scenarios saving amounts and budget,
    "reasoning": "{This must be based on your own judgement for this relevant risklevel, hard limit 200 characters. Suggest 1-3 Investment Companies (Think AAPL, MSFT, Tesla and ETC)}.",
    "riskLevel": "Aggressive"
  }
]

Important: Return ONLY the JSON array, no other text.`

    console.log(`Using Gemini model: ${modelUsed}`)
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      const jsonString = jsonMatch ? jsonMatch[0] : text
      const suggestions = JSON.parse(jsonString)
      
      // Validate the structure
      if (!Array.isArray(suggestions) || suggestions.length !== 3) {
        throw new Error('Invalid response structure')
      }

      // Validate each suggestion has required fields
      for (const suggestion of suggestions) {
        if (!suggestion.monthlyAmount || !suggestion.reasoning || !suggestion.riskLevel) {
          throw new Error('Missing required fields in suggestion')
        }
      }

      return NextResponse.json(suggestions)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text)
      
      // Return fallback suggestions if parsing fails
      const savingsPotential = financialAnalysis.monthlyBreakdown?.savingsPotential || 2000
      const fallbackSuggestions = [
        {
          investmentRate: 0.15,
          monthlyAmount: Math.round(savingsPotential * 0.5),
          reasoning: "Conservative approach - invest 50% of savings potential to maintain emergency fund while building wealth",
          riskLevel: "Conservative"
        },
        {
          investmentRate: 0.20,
          monthlyAmount: Math.round(savingsPotential * 0.7),
          reasoning: "Moderate approach - invest 70% of savings potential for balanced growth and financial security",
          riskLevel: "Moderate"
        },
        {
          investmentRate: 0.25,
          monthlyAmount: Math.round(savingsPotential * 0.85),
          reasoning: "Aggressive approach - invest 85% of savings potential to maximize long-term wealth accumulation",
          riskLevel: "Aggressive"
        }
      ]
      return NextResponse.json(fallbackSuggestions)
    }

  } catch (error) {
    console.error('Gemini suggestion error:', error)
    
    // Return basic fallback suggestions on any error
    const savingsPotential = 1500 // Default assumption
    return NextResponse.json([
      {
        investmentRate: 0.15,
        monthlyAmount: Math.round(savingsPotential * 0.5),
        reasoning: "Conservative approach for steady growth with lower risk",
        riskLevel: "Conservative"
      },
      {
        investmentRate: 0.20,
        monthlyAmount: Math.round(savingsPotential * 0.7),
        reasoning: "Balanced approach for moderate growth with calculated risks",
        riskLevel: "Moderate"
      },
      {
        investmentRate: 0.25,
        monthlyAmount: Math.round(savingsPotential * 0.85),
        reasoning: "Aggressive approach for maximum growth potential",
        riskLevel: "Aggressive"
      }
    ])
  }
}
