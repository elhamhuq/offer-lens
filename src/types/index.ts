export interface JobOffer {
  id: string
  title: string
  company: string
  salary: number
  location: string
  benefits?: string[]
  uploadedAt: Date
}

export interface Investment {
  id: string
  name: string
  monthlyAmount: number
  etfTicker: string
  riskLevel: "low" | "medium" | "high"
}

export interface Scenario {
  id: string
  name: string
  jobOffer: JobOffer
  investments: Investment[]
  createdAt: Date
  updatedAt: Date
}

export interface FinancialProjection {
  year: number
  totalValue: number
  contributions: number
  growth: number
  takeHomePay: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
  }[]
}

export interface CostOfLiving {
  city: string
  index: number
  adjustedSalary: number
}
