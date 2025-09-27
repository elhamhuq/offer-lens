import { z } from 'zod'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import type { ExtractedData } from '@/types/analysis'

// Zod schema for type-safe, structured output from the LLM
const jobOfferSchema = z.object({
  company: z.string().describe("The name of the company offering the job."),
  jobTitle: z.string().describe("The title of the position being offered."),
  baseSalary: z
    .number()
    .describe(
      'The base salary, as a number, excluding bonuses or benefits. Do not include commas or currency symbols.',
    ),
  location: z
    .string()
    .describe(
      'The location of the job, typically in "City, State" format.',
    ),
  benefits: z
    .array(z.string())
    .describe('A list of key benefits offered, such as "Health insurance" or "401(k) match".'),
  startDate: z
    .string()
    .optional()
    .describe("The proposed start date for the position, if mentioned."),
})

export class DataExtractor {
  /**
   * Extracts structured job offer data from a block of text using an LLM.
   * @param text The raw text from the job offer document.
   * @returns A promise that resolves to the structured ExtractedData object.
   */
  static async extract(text: string): Promise<ExtractedData> {
    console.log('🤖 Initializing LangChain data extraction...')
    
    // Initialize the LLM with structured output
    const llm = new ChatOpenAI({
      model: 'gpt-4-turbo', // Powerful model for better accuracy
      temperature: 0.0, // Low temperature for factual, deterministic output
      maxRetries: 2,
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Use withStructuredOutput to ensure the model returns data in our schema format
    const structuredLlm = llm.withStructuredOutput(jobOfferSchema, {
      name: 'job_offer_extraction',
      strict: false, // Allow some flexibility in parsing
    })

    // Create the prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an expert HR assistant specializing in parsing job offer letters. Your task is to extract key information from the provided text and format it into a structured format.
        
        Follow these rules precisely:
        1. Extract the following fields: company, jobTitle, baseSalary, location, benefits, startDate.
        2. For the baseSalary, provide only the numerical value without any currency symbols, commas, or text.
        3. If a specific piece of information is not found, use reasonable defaults (empty string for text, empty array for arrays).
        4. Do not invent data that is not present in the text.`],
      ['human', 'Please extract the required information from the following job offer text:\n\n---\n\n{text}\n\n---']
    ])

    // Chain the prompt with the structured LLM
    const chain = prompt.pipe(structuredLlm)

    try {
      console.log('🧠 Invoking LLM for data extraction...')
      const result = await chain.invoke({
        text,
      })

      console.log('✅ LLM extraction successful:', result)
      
      // Return the result with additional default fields
      return {
        ...result,
        // Add default empty values for any fields not in the schema
        reportingStructure: '',
        additionalInfo: '',
      }

    } catch (error) {
      console.error('❌ LangChain extraction failed:', error)
      throw new Error('Failed to extract structured data using the LLM.')
    }
  }
}

