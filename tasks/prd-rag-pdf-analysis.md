# Product Requirements Document: RAG-Powered PDF Job Offer Analysis Service

## Introduction/Overview

This feature will enable users to upload PDF job offers and receive AI-powered financial analysis through an intelligent document processing pipeline. The system will extract structured data from job offer PDFs, create vector embeddings for semantic understanding, and leverage Google Gemini API to provide expert financial advice, comparisons, and actionable insights that integrate seamlessly with the existing scenario comparison and visualization features.

**Problem Statement**: Users currently need to manually enter job offer details, which is time-consuming and error-prone. They lack intelligent analysis and comparison tools to make informed career decisions.

**Goal**: Create an automated pipeline that transforms unstructured job offer PDFs into actionable financial insights, enabling users to make data-driven career decisions with expert-level analysis.

## Goals

1. **Automated Document Processing**: Extract structured job offer data from PDFs with 95%+ accuracy
2. **Intelligent Analysis**: Provide expert financial insights comparable to a human financial advisor
3. **Seamless Integration**: Transform extracted data into existing Scenario model for comparison
4. **User Experience**: Enable real-time analysis with confidence scores and editable extractions
5. **Conversational Interface**: Allow users to ask follow-up questions about their job offers

## User Stories

**As a job seeker**, I want to upload my job offer PDF so that I can get instant analysis without manual data entry.

**As a financial planner**, I want to compare multiple job offers side-by-side so that I can make the best career decision.

**As a user**, I want to ask follow-up questions about my job offer analysis so that I can understand complex financial implications.

**As a data-driven individual**, I want confidence scores on extracted data so that I can verify and correct any inaccuracies.

**As a busy professional**, I want actionable recommendations so that I can quickly understand what to negotiate or consider.

## Functional Requirements

### 1. PDF Processing Pipeline

1.1. The system shall accept PDF file uploads through the existing FileUpload component
1.2. The system shall extract text content using LangChain PDF loaders
1.3. The system shall chunk extracted text into sentence-level segments
1.4. The system shall create vector embeddings using a suitable embedding model
1.5. The system shall store embeddings in Supabase vector database
1.6. The system shall process and discard original PDF files (no persistent storage)

### 2. Data Extraction & Structuring

2.1. The system shall extract the following fields from job offers:

- Company name
- Job title
- Base salary
- Location
- Benefits (health insurance, 401k, stock options, etc.)
- Start date
- Reporting structure
  2.2. The system shall provide confidence scores (0-100%) for each extracted field
  2.3. The system shall allow users to edit and correct extracted data
  2.4. The system shall validate extracted salary data against reasonable ranges

### 3. AI-Powered Analysis

3.1. The system shall send extracted job offer data to Google Gemini API
3.2. The system shall request financial analysis in the following areas:

- Take-home pay calculations (after taxes and deductions)
- Cost-of-living adjustments for the location
- Benefits valuation and comparison
- Long-term career growth potential
- Investment opportunity analysis
  3.3. The system shall generate insights in natural language format
  3.4. The system shall provide actionable recommendations for negotiation

### 4. Scenario Integration

4.1. The system shall transform extracted job offer data into the existing Scenario model
4.2. The system shall store scenarios in the existing scenarios table
4.3. The system shall link scenarios to user accounts for comparison
4.4. The system shall enable side-by-side comparison using existing ScenarioComparison component
4.5. The system shall integrate with existing FinancialChart and AIExplanation components

### 5. Conversational Interface

5.1. The system shall allow users to ask follow-up questions about their job offers
5.2. The system shall maintain conversation context within a session
5.3. The system shall provide relevant answers based on extracted data and financial analysis
5.4. The system shall save analysis history for future reference

### 6. Real-time Processing

6.1. The system shall process PDFs within 30-60 seconds of upload
6.2. The system shall provide progress indicators during processing
6.3. The system shall handle multiple concurrent uploads efficiently
6.4. The system shall implement proper error handling and user feedback

## Non-Goals (Out of Scope)

- Support for non-PDF document formats (Word docs, images, etc.)
- Building a knowledge base of job market data
- Automatic comparison of multiple job offers without user request
- Handling confidential/sensitive information with special security measures
- Batch processing capabilities
- Integration with external job market APIs
- Real-time market data integration

## Design Considerations

### Database Schema Extensions

```sql
-- New table for document processing metadata
CREATE TABLE document_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  confidence_scores JSONB,
  extracted_data JSONB,
  ai_analysis TEXT,
  conversation_history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector embeddings table for RAG
CREATE TABLE job_offer_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_analysis_id UUID REFERENCES document_analysis(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536), -- Adjust based on embedding model
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints

- `POST /api/upload/analyze` - Upload and analyze PDF
- `GET /api/analysis/{id}/status` - Check processing status
- `GET /api/analysis/{id}/results` - Get analysis results
- `PUT /api/analysis/{id}/extracted-data` - Update extracted data
- `POST /api/analysis/{id}/chat` - Ask follow-up questions
- `GET /api/analysis/history` - Get user's analysis history

## Technical Considerations

### Technology Stack

- **Document Processing**: LangChain PDF loaders
- **Vector Embeddings**: OpenAI embeddings or similar
- **Vector Database**: Supabase with pgvector extension
- **AI Analysis**: Google Gemini API
- **Backend**: Next.js API routes with Python microservice for heavy processing
- **Queue System**: Redis or Supabase Edge Functions for job processing

### Performance Requirements

- PDF processing: < 60 seconds for typical job offers (2-5 pages)
- Vector search: < 2 seconds response time
- AI analysis: < 30 seconds for comprehensive analysis
- Concurrent processing: Support 10+ simultaneous uploads

### Security Considerations

- Input validation for all uploaded files
- Rate limiting on upload endpoints
- Secure handling of AI API keys
- User data isolation and RLS policies

## Success Metrics

1. **Accuracy**: 95%+ accuracy in extracting key job offer fields
2. **User Adoption**: 80% of users who upload PDFs complete the analysis
3. **Processing Time**: Average processing time < 45 seconds
4. **User Satisfaction**: 4.5+ star rating for analysis quality
5. **Conversion**: 60% of analyzed job offers result in scenario comparisons
6. **Engagement**: Average 3+ follow-up questions per analysis session

## Open Questions

1. Should we implement document versioning if users upload updated job offers?
2. How should we handle multi-page job offers with varying formats?
3. Should we provide industry-specific analysis templates?
4. How do we handle job offers in languages other than English?
5. Should we implement caching for similar job offers to improve processing speed?
6. How should we handle edge cases like commission-based compensation or equity packages?
7. Should we provide integration with existing financial planning tools?
8. How do we ensure compliance with data privacy regulations for uploaded documents?

## Implementation Phases

### Phase 1: Core PDF Processing (Weeks 1-2)

- Set up LangChain PDF processing pipeline
- Implement basic data extraction
- Create database schema extensions
- Build upload and status checking APIs

### Phase 2: AI Integration (Weeks 3-4)

- Integrate Google Gemini API
- Implement financial analysis prompts
- Create confidence scoring system
- Build user editing interface for extracted data

### Phase 3: Scenario Integration (Weeks 5-6)

- Transform extracted data to Scenario model
- Integrate with existing comparison components
- Implement conversation interface
- Add analysis history features

### Phase 4: Optimization & Polish (Weeks 7-8)

- Performance optimization
- Error handling improvements
- User experience refinements
- Testing and bug fixes

