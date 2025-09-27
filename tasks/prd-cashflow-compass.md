# Product Requirements Document: Cashflow Compass

## Introduction/Overview

Cashflow Compass is a full-stack financial decision-making tool that helps recent graduates and professionals evaluate job offers by combining salary analysis with investment planning. The application addresses the common challenge of making informed career decisions by providing comprehensive financial projections that consider both immediate compensation and long-term investment growth potential.

The goal is to create a working demo for a hackathon that demonstrates the core value proposition: intelligent job offer evaluation with integrated financial planning.

## Goals

1. **Primary Goal**: Create a functional demo that combines job offer evaluation with investment portfolio optimization
2. **User Experience Goal**: Provide clear, AI-explained financial insights that help users make informed career decisions
3. **Technical Goal**: Demonstrate seamless integration between PDF parsing, financial simulations, and AI explanations
4. **Demo Goal**: Showcase a polished, working application suitable for hackathon presentation

## User Stories

1. **As a recent graduate**, I want to upload multiple job offer PDFs so that I can compare them with comprehensive financial projections.

2. **As a professional considering a career move**, I want to input my investment preferences and see how different job offers impact my long-term wealth building.

3. **As someone unfamiliar with financial concepts**, I want AI-generated explanations of simulation results so that I can understand the implications of my decisions.

4. **As a user comparing opportunities**, I want to see side-by-side comparisons of job offers with cost-of-living adjustments and portfolio optimization.

5. **As someone planning for the future**, I want to run Monte Carlo simulations to understand the range of possible financial outcomes for each career path.

## Functional Requirements

### Core Features

1. **Job Offer Processing**

   - The system must allow users to upload job offer documents in PDF format
   - The system must parse and extract key compensation details (salary, bonuses, equity, benefits)
   - The system must handle text input as an alternative to PDF upload
   - The system must store parsed job offer data for comparison

2. **Investment Portfolio Management**

   - The system must allow users to input their investment preferences through a simple interface
   - The system must support basic asset allocation (stocks, bonds, cash percentages)
   - The system must provide preset portfolio templates (conservative, moderate, aggressive)
   - The system must store user investment preferences

3. **Financial Simulations**

   - The system must run efficient frontier analysis for portfolio optimization
   - The system must perform cost-of-living comparisons between different cities
   - The system must calculate tax impact analysis for different scenarios
   - The system must generate projections over multiple time horizons (5, 10, 20 years)

4. **AI-Powered Explanations**

   - The system must integrate with Google Gemini API to generate explanations
   - The system must explain simulation results in plain language
   - The system must provide investment strategy recommendations
   - The system must offer contextual help for financial terms

5. **User Interface**

   - The system must provide a responsive web interface built with Next.js and Tailwind CSS
   - The system must display interactive charts using ECharts
   - The system must include smooth animations using Framer Motion
   - The system must support side-by-side comparison of multiple scenarios

6. **Data Management**
   - The system must support user authentication via Supabase Auth
   - The system must store user scenarios and simulation runs
   - The system must allow users to save and revisit previous analyses
   - The system must maintain data persistence across sessions

### Technical Requirements

7. **Frontend Architecture**

   - Next.js with React and TypeScript
   - Tailwind CSS with shadcn/ui components
   - Zustand for state management
   - ECharts for data visualization
   - Framer Motion for animations

8. **Backend Architecture**

   - Next.js API routes for server-side logic
   - PDF parsing capabilities for job offer documents
   - Integration with Google Gemini API
   - Financial calculation engines for simulations

9. **Database Schema**
   - Users table (id, email, created_at)
   - Scenarios table (id, user_id, created_at, name, salary, expenses_json, city)
   - Runs table (id, scenario_id, created_at, weights_json, metrics_json)

## Non-Goals (Out of Scope)

1. **Real-time market data integration** - Will use static/sample data for demo
2. **Advanced tax optimization** - Basic tax calculations only
3. **Integration with external financial accounts** - Manual input only
4. **Mobile native applications** - Web-only for initial demo
5. **Multi-currency support** - USD only for hackathon demo
6. **Advanced portfolio rebalancing** - Basic allocation optimization only
7. **Social features or sharing** - Individual user focus only
8. **Complex financial instruments** - Stocks, bonds, and cash only

## Design Considerations

### User Interface

- Clean, modern design using shadcn/ui components
- Intuitive workflow: Upload → Parse → Configure → Simulate → Compare
- Interactive charts and visualizations for financial data
- Responsive design for desktop and tablet viewing
- Accessible color palettes and clear typography

### User Experience

- Minimal user input required - smart defaults and templates
- Progressive disclosure of advanced options
- Clear loading states during PDF parsing and simulations
- Error handling with helpful guidance
- Onboarding flow to guide first-time users

## Technical Considerations

### Dependencies

- Supabase for authentication, database, and file storage
- Google Gemini API for AI explanations
- PDF parsing library (pdf-parse or similar)
- Financial calculation libraries for Monte Carlo simulations
- ECharts React wrapper for visualizations

### Performance

- Efficient algorithms for financial calculations
- Caching of simulation results
- Optimized PDF parsing
- Minimal API calls through smart batching

### Security

- Secure file upload and parsing
- API route protection
- Input validation and sanitization
- Environment variable management

## Success Metrics

### Demo Success Criteria

1. **Functional completeness**: All core workflows work end-to-end
2. **Performance**: PDF parsing completes within 10 seconds
3. **User experience**: Intuitive interface requiring minimal explanation
4. **Visual appeal**: Professional, polished appearance suitable for presentation
5. **Reliability**: Demo runs consistently without crashes or errors

### Technical Metrics

- Successful PDF parsing rate > 90%
- API response times < 2 seconds
- Zero critical bugs during demo presentation
- Clean, maintainable code structure

## Open Questions

1. **PDF Parsing Accuracy**: What fallback mechanisms should we implement if PDF parsing fails?
2. **Simulation Complexity**: How detailed should the Monte Carlo simulations be for the demo?
3. **Sample Data**: Should we include pre-populated sample scenarios for demo purposes?
4. **Gemini API Usage**: What are the rate limits and how should we handle API failures gracefully?
5. **Deployment**: What hosting platform should be used for the hackathon demo?

## Implementation Priority

### Phase 1: Core Infrastructure

- Project setup with all dependencies
- Database schema and Supabase configuration
- Basic authentication flow
- API route scaffolding

### Phase 2: Essential Features

- PDF parsing and job offer extraction
- Basic investment input interface
- Simple financial calculations
- Data storage and retrieval

### Phase 3: Demo Polish

- Chart visualizations
- AI explanations integration
- UI/UX refinements
- Error handling and loading states

This PRD provides a clear roadmap for building a compelling hackathon demo while maintaining focus on core value proposition and technical feasibility.
