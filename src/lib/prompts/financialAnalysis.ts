/**
 * Financial analysis prompt templates for Google Gemini
 * These prompts are designed to extract maximum value from job offer analysis
 */

import type { ExtractedData } from '@/types/analysis'

export interface AnalysisContext {
  currentSalary?: number
  currentLocation?: string
  experienceLevel?: string
  careerGoals?: string[]
  familySize?: number
  debtObligations?: number
  savingsGoals?: number
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive'
}

/**
 * Prompt templates for different types of financial analysis
 */
export const PromptTemplates = {
  /**
   * Comprehensive compensation analysis
   */
  compensation: (data: ExtractedData, context?: AnalysisContext) => `
You are a compensation analyst with expertise in tech industry salaries and benefits.

Analyze this compensation package:
- Company: ${data.company}
- Role: ${data.jobTitle}
- Base Salary: $${data.baseSalary}
- Location: ${data.location}
- Benefits: ${data.benefits?.join(', ') || 'Not specified'}

${context?.currentSalary ? `Current Compensation: $${context.currentSalary}` : ''}
${context?.experienceLevel ? `Experience Level: ${context.experienceLevel}` : ''}

Provide a detailed analysis including:
1. How this salary compares to market rates for this role and location
2. The real value of the benefits package (estimate monetary value)
3. Total compensation calculation
4. Tax implications and take-home pay estimates
5. Negotiation leverage points and strategies
6. Red flags or exceptional aspects of the offer

Use specific numbers and percentages where possible.
`,

  /**
   * Cost of living and lifestyle impact analysis
   */
  lifestyle: (data: ExtractedData, context?: AnalysisContext) => `
You are a financial lifestyle advisor specializing in relocation and cost of living analysis.

Evaluate the lifestyle impact of this job offer:
- Location: ${data.location}
- Salary: $${data.baseSalary}
- Company: ${data.company}

${context?.currentLocation ? `Current Location: ${context.currentLocation}` : ''}
${context?.familySize ? `Family Size: ${context.familySize}` : ''}

Analyze:
1. Cost of living index and purchasing power in ${data.location}
2. Housing costs (rent/mortgage) as percentage of income
3. Transportation, food, and entertainment costs
4. Quality of life factors (schools, healthcare, recreation)
5. Savings potential after typical expenses
6. Comparison to ${context?.currentLocation || 'national average'}

Provide specific monthly budget breakdowns and lifestyle scenarios.
`,

  /**
   * Long-term wealth building analysis
   */
  wealthBuilding: (data: ExtractedData, context?: AnalysisContext) => `
You are a wealth management advisor focused on long-term financial planning.

Project wealth building potential for this opportunity:
- Starting Salary: $${data.baseSalary}
- Company: ${data.company} (consider growth trajectory)
- Benefits: ${data.benefits?.join(', ') || 'None specified'}

${context?.savingsGoals ? `Savings Goals: $${context.savingsGoals}` : ''}
${context?.riskTolerance ? `Risk Tolerance: ${context.riskTolerance}` : ''}

Calculate and explain:
1. 5, 10, and 20-year wealth projections
2. Retirement savings potential (401k, IRA contributions)
3. Investment opportunities with disposable income
4. Home ownership timeline and equity building
5. Financial independence trajectory
6. Impact of company stock options or equity (if applicable)

Include compound interest calculations and realistic growth assumptions.
`,

  /**
   * Career growth and earning potential analysis
   */
  careerGrowth: (data: ExtractedData, context?: AnalysisContext) => `
You are a career strategist specializing in tech career trajectories and compensation growth.

Evaluate career growth potential:
- Company: ${data.company}
- Position: ${data.jobTitle}
- Starting Salary: $${data.baseSalary}

${context?.careerGoals ? `Career Goals: ${context.careerGoals.join(', ')}` : ''}
${context?.experienceLevel ? `Current Level: ${context.experienceLevel}` : ''}

Analyze:
1. Typical career progression path at ${data.company}
2. Salary growth trajectory (1, 3, 5 years)
3. Skill development opportunities
4. Industry positioning and market value growth
5. Promotion timeline and title progression
6. Exit opportunities and their compensation ranges

Provide specific role titles, timelines, and salary ranges.
`,

  /**
   * Risk assessment and stability analysis
   */
  riskAssessment: (data: ExtractedData, context?: AnalysisContext) => `
You are a risk analyst evaluating job offer stability and financial security.

Assess risks and stability factors:
- Company: ${data.company}
- Salary: $${data.baseSalary}
- Industry/Role: ${data.jobTitle}

${context?.debtObligations ? `Current Debt: $${context.debtObligations}` : ''}
${context?.familySize ? `Dependents: ${context.familySize}` : ''}

Evaluate:
1. Company financial health and stability
2. Industry trends and job security
3. Income stability and variability
4. Benefits reliability (healthcare, retirement)
5. Emergency fund requirements for this role
6. Financial risks and mitigation strategies

Rate overall financial risk (1-10) and provide contingency recommendations.
`,

  /**
   * Negotiation strategy builder
   */
  negotiation: (data: ExtractedData, context?: AnalysisContext) => `
You are a negotiation expert specializing in tech compensation packages.

Develop a negotiation strategy for this offer:
- Current Offer: $${data.baseSalary}
- Company: ${data.company}
- Role: ${data.jobTitle}
- Location: ${data.location}

${context?.currentSalary ? `Current Salary: $${context.currentSalary}` : ''}
${context?.experienceLevel ? `Experience: ${context.experienceLevel}` : ''}

Provide:
1. Market-based salary range for negotiation
2. Specific benefits to negotiate (priority order)
3. Negotiation talking points and justifications
4. Counter-offer strategy (initial, target, walk-away)
5. Non-monetary negotiation items (flexibility, PTO, etc.)
6. Timing and communication tactics

Include specific scripts and percentage increases to request.
`,

  /**
   * Comparative market analysis
   */
  marketComparison: (data: ExtractedData, similarRoles?: ExtractedData[]) => `
You are a market research analyst specializing in compensation benchmarking.

Compare this offer to market standards:
- Offer: ${data.company} - ${data.jobTitle} at $${data.baseSalary}
- Location: ${data.location}

${similarRoles ? `Similar roles in market:
${similarRoles.map(r => `- ${r.company}: $${r.baseSalary}`).join('\n')}` : ''}

Analyze:
1. Percentile ranking in market (25th, 50th, 75th, 90th)
2. Comparison to FAANG and top-tier companies
3. Comparison to startups and mid-size companies
4. Geographic salary adjustments
5. Benefits competitiveness score
6. Overall offer rating (1-10) with justification

Provide specific company comparisons and data sources.
`,

  /**
   * Tax optimization analysis
   */
  taxStrategy: (data: ExtractedData, context?: AnalysisContext) => `
You are a tax strategist specializing in employment compensation optimization.

Analyze tax implications and optimization strategies:
- Gross Salary: $${data.baseSalary}
- Location: ${data.location} (consider state/local taxes)
- Benefits: ${data.benefits?.join(', ') || 'None specified'}

Calculate and recommend:
1. Federal, state, and local tax breakdown
2. Effective tax rate and take-home pay
3. Tax-advantaged benefit elections (401k, HSA, FSA)
4. Optimal withholding strategies
5. Deduction opportunities specific to this role
6. Year-end tax planning strategies

Provide specific monthly and annual after-tax income calculations.
`,

  /**
   * Benefits valuation and optimization
   */
  benefitsAnalysis: (data: ExtractedData) => `
You are a benefits specialist focused on maximizing total compensation value.

Value and optimize this benefits package:
- Company: ${data.company}
- Benefits Listed: ${data.benefits?.join(', ') || 'None specified'}
- Base Salary: $${data.baseSalary} (for context)

Analyze:
1. Monetary value of each benefit (annual)
2. Hidden or underutilized benefit values
3. Benefits quality score vs industry standards
4. Optimization strategies for maximum value
5. Benefits gaps and what to negotiate
6. Total compensation including benefits value

Provide specific dollar values and utilization strategies.
`,

  /**
   * Relocation analysis (if applicable)
   */
  relocation: (data: ExtractedData, currentLocation: string) => `
You are a relocation specialist analyzing financial impacts of job-related moves.

Evaluate relocation from ${currentLocation} to ${data.location}:
- New Salary: $${data.baseSalary}
- Company: ${data.company}

Calculate:
1. Moving costs and relocation assistance needs
2. Cost of living adjustment (percentage change)
3. Real purchasing power change
4. Housing market comparison (rent/buy analysis)
5. Quality of life financial impacts
6. Break-even timeline for relocation

Provide specific costs, timelines, and ROI calculations.
`,
}

/**
 * Combine multiple prompt templates for comprehensive analysis
 */
export function buildComprehensivePrompt(
  data: ExtractedData,
  context?: AnalysisContext,
  analysisTypes: Array<keyof typeof PromptTemplates> = ['compensation', 'lifestyle', 'wealthBuilding']
): string {
  const prompts = analysisTypes.map(type => {
    if (type === 'marketComparison' || type === 'relocation') {
      // These require special parameters
      return ''
    }
    return PromptTemplates[type](data, context)
  }).filter(p => p)

  return `Perform a comprehensive financial analysis combining the following perspectives:

${prompts.join('\n---\n')}

Synthesize all analyses into a cohesive recommendation with:
1. Executive summary
2. Key decision factors
3. Financial projections
4. Risk-adjusted recommendation
5. Action items and next steps`
}

/**
 * Generate context-aware follow-up prompts
 */
export function generateFollowUpPrompts(
  previousQuestion: string,
  previousAnswer: string
): string[] {
  return [
    `Based on the analysis, what specific negotiation tactics would be most effective?`,
    `How does this compare to similar roles at competing companies?`,
    `What would be the 5-year financial impact of accepting this offer?`,
    `What are the key risks I should consider before accepting?`,
    `How much should I counter-offer to reach market rate?`,
    `What benefits should I prioritize negotiating?`,
    `How does this affect my path to financial independence?`,
    `What's the opportunity cost compared to staying in my current role?`,
  ]
}

/**
 * Build prompts for scenario comparison
 */
export function buildScenarioPrompt(
  scenarios: Array<{ name: string; data: ExtractedData }>,
  criteria: string[]
): string {
  const scenarioText = scenarios.map(s => `
Scenario: ${s.name}
- Company: ${s.data.company}
- Salary: $${s.data.baseSalary}
- Location: ${s.data.location}
- Benefits: ${s.data.benefits?.join(', ') || 'None'}
`).join('\n')

  return `Compare these career scenarios based on financial impact:

${scenarioText}

Evaluation Criteria (in priority order):
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide:
1. Quantitative comparison table
2. 5-year financial projection for each
3. Risk-adjusted recommendations
4. Scenario ranking with justification
5. Key trade-offs and decision factors

Use specific numbers and percentages for all comparisons.`
}
