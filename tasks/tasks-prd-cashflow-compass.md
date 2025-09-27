# Task List: Cashflow Compass

## Relevant Files

- `package.json` - Project dependencies and scripts configuration
- `next.config.js` - Next.js configuration file
- `tailwind.config.js` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
- `.env.example` - Environment variables template
- `.env.local` - Local environment variables (not committed)
- `eslint.config.js` - ESLint configuration
- `prettier.config.js` - Prettier configuration
- `README.md` - Project setup and run instructions
- `src/app/layout.tsx` - Next.js app layout with providers
- `src/app/page.tsx` - Main landing page component
- `src/app/dashboard/page.tsx` - Dashboard page for authenticated users
- `src/app/api/auth/route.ts` - Supabase authentication API route
- `src/app/api/parse-offer/route.ts` - PDF/text parsing API route
- `src/app/api/financial-simulation/route.ts` - Financial calculations API route
- `src/app/api/gemini/route.ts` - Google Gemini API integration route
- `src/components/ui/` - shadcn/ui components directory
- `src/components/FileUpload.tsx` - Job offer upload component
- `src/components/InvestmentForm.tsx` - Investment preferences form
- `src/components/FinancialChart.tsx` - ECharts visualization component
- `src/components/ScenarioComparison.tsx` - Side-by-side comparison component
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/gemini.ts` - Google Gemini API client
- `src/lib/financial-calculations.ts` - Financial simulation utilities
- `src/lib/pdf-parser.ts` - PDF parsing utilities
- `src/store/useStore.ts` - Zustand state management store
- `src/types/index.ts` - TypeScript type definitions
- `supabase/migrations/001_initial_schema.sql` - Database schema migration

### Notes

- This is a fresh project starting from scratch
- Focus on creating a working demo with all core features scaffolded
- Unit tests will be added in later phases if time permits during hackathon
- Use `npm run dev` to start development server
- Use `npx supabase start` for local database development

## Tasks

- [x] 1.0 Project Setup and Configuration
  - [x] 1.1 Initialize Next.js project with TypeScript and configure basic structure
  - [x] 1.2 Install and configure all required dependencies (Tailwind, shadcn/ui, Zustand, ECharts, Framer Motion)
  - [x] 1.3 Set up ESLint and Prettier with recommended configurations
  - [x] 1.4 Create .env.example with all required environment variable placeholders
  - [x] 1.5 Configure Next.js settings (next.config.js) for file uploads and API optimization
  - [x] 1.6 Initialize shadcn/ui and configure component library
  - [x] 1.7 Set up Tailwind CSS with custom theme and responsive breakpoints
  - [x] 1.8 Create comprehensive README.md with setup and run instructions

- [ ] 2.0 Database Schema and Supabase Integration
  - [ ] 2.1 Set up Supabase project and obtain connection credentials
  - [ ] 2.2 Create database migration for users table (id, email, created_at)
  - [ ] 2.3 Create database migration for scenarios table (id, user_id, created_at, name, salary, expenses_json, city)
  - [ ] 2.4 Create database migration for runs table (id, scenario_id, created_at, weights_json, metrics_json)
  - [ ] 2.5 Configure Supabase client with proper TypeScript types
  - [ ] 2.6 Set up Row Level Security (RLS) policies for all tables
  - [ ] 2.7 Create database utility functions for CRUD operations

- [ ] 3.0 Authentication System
  - [ ] 3.1 Configure Supabase Auth with email/password authentication
  - [ ] 3.2 Create authentication API routes (login, logout, signup)
  - [ ] 3.3 Implement authentication middleware for protected routes
  - [ ] 3.4 Create login/signup UI components with form validation
  - [ ] 3.5 Set up authentication state management in Zustand store
  - [ ] 3.6 Create protected route wrapper component
  - [ ] 3.7 Implement session persistence and automatic token refresh

- [ ] 4.0 Core API Routes Development
  - [ ] 4.1 Create PDF parsing API route with file upload handling
  - [ ] 4.2 Implement job offer data extraction logic (salary, benefits, equity parsing)
  - [ ] 4.3 Create financial simulation API route with efficient frontier calculations
  - [ ] 4.4 Implement cost-of-living comparison calculations
  - [ ] 4.5 Create Google Gemini API integration for AI explanations
  - [ ] 4.6 Implement Monte Carlo simulation engine for portfolio projections
  - [ ] 4.7 Create data validation and error handling for all API routes
  - [ ] 4.8 Add rate limiting and security measures to API endpoints

- [ ] 5.0 Frontend Components and UI
  - [ ] 5.1 Create main layout component with navigation and responsive design
  - [ ] 5.2 Build file upload component for job offer PDFs with drag-and-drop
  - [ ] 5.3 Create investment preferences form with portfolio templates
  - [ ] 5.4 Implement interactive financial charts using ECharts
  - [ ] 5.5 Build scenario comparison component with side-by-side layout
  - [ ] 5.6 Create AI explanation display component with formatted text
  - [ ] 5.7 Implement loading states and error handling throughout UI
  - [ ] 5.8 Add Framer Motion animations for smooth transitions
  - [ ] 5.9 Create dashboard page with scenario management
  - [ ] 5.10 Implement responsive design and mobile optimization
