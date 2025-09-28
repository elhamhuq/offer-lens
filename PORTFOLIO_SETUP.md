# Portfolio System Setup

This document explains how to set up and use the new portfolio system in Offer Lens.

## Database Migration

To add the portfolios table and update the scenarios table with portfolio_id field:

1. **Apply the migration:**

   ```bash
   # If using Supabase CLI
   supabase db push

   # Or manually run the SQL in your Supabase dashboard
   # File: supabase/migrations/20250929000001_create_portfolios_table.sql
   ```

2. **Verify the migration:**
   - Check that the `portfolios` table exists
   - Check that the `scenarios` table has a `portfolio_id` column
   - Verify that RLS policies are in place

## Database Schema

### Portfolios Table

```sql
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  portfolio_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')) DEFAULT 'moderate',
  investment_horizon TEXT CHECK (investment_horizon IN ('short', 'medium', 'long')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Scenarios Table Update

```sql
ALTER TABLE scenarios
ADD COLUMN portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL;
```

## API Endpoints

### Portfolios Collection

- `GET /api/portfolios` - List user's portfolios (with filtering)
- `POST /api/portfolios` - Create a new portfolio

### Individual Portfolio

- `GET /api/portfolios/[id]` - Get specific portfolio with associated scenarios
- `PUT /api/portfolios/[id]` - Update portfolio
- `DELETE /api/portfolios/[id]` - Delete portfolio

## Usage Examples

### 1. Create a Portfolio

```typescript
import { usePortfolio } from '@/hooks/usePortfolio';

const { createPortfolio } = usePortfolio();

const newPortfolio = await createPortfolio({
  name: 'Conservative Retirement',
  description: 'Low-risk portfolio for retirement planning',
  portfolio_data: {
    stocks: { percentage: 30 },
    bonds: { percentage: 50 },
    cash: { percentage: 20 },
  },
  risk_tolerance: 'conservative',
  investment_horizon: 'long',
});
```

### 2. Link Scenario to Portfolio

```typescript
// When creating or updating a scenario
const scenarioData = {
  name: 'Job Offer Analysis',
  job_offer: {
    /* job offer data */
  },
  investments: {
    /* investment data */
  },
  portfolio_id: portfolioId, // Link to existing portfolio
};
```

### 3. Fetch Portfolio with Scenarios

```typescript
const { getPortfolio } = usePortfolio();
const portfolio = await getPortfolio(portfolioId);
// portfolio.scenarios will contain associated scenarios
```

## Portfolio Data Structure

The `portfolio_data` JSONB field can contain:

```typescript
{
  stocks: {
    percentage: 60,
    sectors: {
      technology: 30,
      healthcare: 20,
      finance: 10
    },
    individual_stocks: [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        percentage: 10,
        shares: 100,
        cost_basis: 15000
      }
    ]
  },
  bonds: {
    percentage: 30,
    types: {
      government: 20,
      corporate: 10
    }
  },
  cash: {
    percentage: 10,
    accounts: [
      {
        type: "savings",
        balance: 5000,
        interest_rate: 0.02
      }
    ]
  },
  alternative_investments: {
    percentage: 0
  }
}
```

## TypeScript Types

All portfolio-related types are defined in `src/types/portfolio.ts`:

- `Portfolio` - Main portfolio interface
- `PortfolioData` - Structure for portfolio_data JSONB field
- `CreatePortfolioRequest` - For creating portfolios
- `UpdatePortfolioRequest` - For updating portfolios
- `PortfolioAnalysis` - For future analysis features

## React Hook

Use the `usePortfolio` hook for easy portfolio management:

```typescript
import { usePortfolio } from '@/hooks/usePortfolio';

function PortfolioManager() {
  const {
    portfolios,
    loading,
    error,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    getPortfolio,
    refetch,
  } = usePortfolio();

  // Use the portfolio data...
}
```

## Security

- All endpoints require authentication
- RLS policies ensure users can only access their own portfolios
- Portfolio deletion sets `portfolio_id` to NULL in scenarios (cascade protection)

## Next Steps

1. Apply the migration
2. Update your frontend to use the portfolio system
3. Consider adding portfolio analysis features
4. Implement portfolio comparison functionality
