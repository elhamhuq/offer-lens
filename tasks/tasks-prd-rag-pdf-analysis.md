## Relevant Files

- `supabase/migrations/20250927000003_rag_analysis_schema.sql` - Database schema extensions for document analysis and vector embeddings.
- `src/lib/embeddings.ts` - Vector embedding utilities and LangChain integration.
- `src/lib/gemini.ts` - Google Gemini API client for financial analysis.
- `src/lib/documentProcessor.ts` - PDF processing and text extraction logic.
- `src/types/analysis.ts` - TypeScript interfaces for analysis data structures.
- `src/hooks/useAnalysis.ts` - React hook for managing analysis state and API calls.
- `src/components/AnalysisResults.tsx` - Component to display extracted data with confidence scores and editing capabilities.
- `src/components/AnalysisChat.tsx` - Conversational interface for follow-up questions.
- `src/app/api/upload/analyze/route.ts` - API endpoint for PDF upload and analysis initiation.
- `src/app/api/analysis/[id]/status/route.ts` - API endpoint for checking analysis processing status.
- `src/app/api/analysis/[id]/results/route.ts` - API endpoint for retrieving analysis results.
- `src/app/api/analysis/[id]/chat/route.ts` - API endpoint for conversational follow-up questions.
- `src/app/dashboard/analysis/page.tsx` - Analysis history and management page.
- `src/components/FileUpload.tsx` - Enhanced file upload component with RAG integration.

### Notes

- The existing `FileUpload.tsx` component already has mock extracted data structure that matches our requirements.
- Current `JobOffer` interface in `src/types/index.ts` aligns well with extraction requirements.
- Database schema needs extensions for document analysis and vector storage.
- Integration with existing `ScenarioComparison`, `FinancialChart`, and `AIExplanation` components will leverage current UI patterns.

## Tasks

- [x] 1.0 Database Schema Extensions
  - [x] 1.1 Create migration file for document_analysis table with proper RLS policies
  - [x] 1.2 Add job_offer_embeddings table with pgvector extension support
  - [x] 1.3 Create indexes for performance optimization on analysis queries
  - [x] 1.4 Update TypeScript types to include new database interfaces
  - [x] 1.5 Test database migrations and verify RLS policies work correctly

- [x] 2.0 PDF Processing Pipeline
  - [x] 2.1 Set up LangChain PDF loader with proper error handling
  - [x] 2.2 Implement sentence-level text chunking strategy
  - [x] 2.3 Create text preprocessing utilities (cleaning, normalization)
  - [x] 2.4 Add file validation (size limits, format checking, security scanning)
  - [x] 2.5 Implement progress tracking for long-running processing tasks

- [x] 3.0 Vector Embeddings Infrastructure
  - [x] 3.1 Set up OpenAI embeddings API integration
  - [x] 3.2 Create embedding generation utilities with batch processing
  - [x] 3.3 Implement vector storage in Supabase with pgvector
  - [x] 3.4 Add semantic search functionality for document retrieval
  - [x] 3.5 Create embedding update and deletion utilities

- [x] 4.0 Data Extraction Engine
  - [x] 4.1 Build structured data extraction using LangChain chains
  - [x] 4.2 Implement confidence scoring for extracted fields
  - [x] 4.3 Add validation rules for salary, location, and other key fields
  - [x] 4.4 Create data transformation utilities to JobOffer interface
  - [x] 4.5 Implement error handling for extraction failures

- [x] 5.0 Google Gemini Integration
  - [x] 5.1 Set up Gemini API client with proper authentication
  - [x] 5.2 Create financial analysis prompts for different analysis types
  - [x] 5.3 Implement response parsing and formatting utilities
  - [x] 5.4 Add conversation context management for follow-up questions
  - [x] 5.5 Create error handling and rate limiting for API calls

- [x] 6.0 API Endpoints
  - [x] 6.1 Build POST /api/upload/analyze endpoint with file processing
  - [x] 6.2 Create GET /api/analysis/[id]/status for real-time progress updates
  - [x] 6.3 Implement GET /api/analysis/[id]/results for retrieving analysis data
  - [x] 6.4 Build PUT /api/analysis/[id]/extracted-data for user corrections
  - [x] 6.5 Create POST /api/analysis/[id]/chat for conversational interface
  - [x] 6.6 Add GET /api/analysis/history for user's analysis history

- [x] 7.0 Frontend Components
  - [x] 7.1 Enhance FileUpload component with RAG processing integration
  - [x] 7.2 Create AnalysisResults component with confidence scores and editing
  - [x] 7.3 Build AnalysisChat component for follow-up questions
  - [x] 7.4 Add progress indicators and status updates for processing
  - [x] 7.5 Create analysis history page with search and filtering

- [ ] 8.0 Scenario Integration
  - [ ] 8.1 Transform extracted data to existing Scenario model format
  - [ ] 8.2 Integrate with existing ScenarioComparison component
  - [ ] 8.3 Connect to FinancialChart component for visualization
  - [ ] 8.4 Link with AIExplanation component for insights
  - [ ] 8.5 Update useScenario hook to handle RAG-generated scenarios

- [ ] 9.0 Real-time Processing
  - [ ] 9.1 Implement WebSocket or Server-Sent Events for status updates
  - [ ] 9.2 Add job queue system for handling concurrent uploads
  - [ ] 9.3 Create processing time optimization strategies
  - [ ] 9.4 Implement retry logic for failed processing attempts
  - [ ] 9.5 Add timeout handling and user feedback for long operations

- [ ] 10.0 Testing and Quality Assurance
  - [ ] 10.1 Write unit tests for PDF processing and extraction logic
  - [ ] 10.2 Create integration tests for API endpoints
  - [ ] 10.3 Test vector search accuracy with sample job offers
  - [ ] 10.4 Validate AI analysis quality with various document formats
  - [ ] 10.5 Performance testing for concurrent upload scenarios
  - [ ] 10.6 End-to-end testing of complete analysis workflow

- [ ] 11.0 Error Handling and User Experience
  - [ ] 11.1 Implement comprehensive error handling for all failure points
  - [ ] 11.2 Create user-friendly error messages and recovery options
  - [ ] 11.3 Add loading states and progress indicators throughout the flow
  - [ ] 11.4 Implement data validation and sanitization
  - [ ] 11.5 Create fallback mechanisms for API failures

- [ ] 12.0 Performance Optimization
  - [ ] 12.1 Optimize PDF processing speed with parallel chunking
  - [ ] 12.2 Implement caching for repeated analysis requests
  - [ ] 12.3 Optimize vector search queries and indexing
  - [ ] 12.4 Add compression for large document embeddings
  - [ ] 12.5 Monitor and optimize API response times

- [ ] 13.0 Security and Privacy
  - [ ] 13.1 Implement file upload security scanning
  - [ ] 13.2 Add rate limiting for upload and analysis endpoints
  - [ ] 13.3 Secure API key management for external services
  - [ ] 13.4 Implement proper data isolation with RLS policies
  - [ ] 13.5 Add audit logging for document processing activities

- [ ] 14.0 Documentation and Deployment
  - [ ] 14.1 Create API documentation for all endpoints
  - [ ] 14.2 Write deployment guide for production setup
  - [ ] 14.3 Document environment variables and configuration
  - [ ] 14.4 Create troubleshooting guide for common issues
  - [ ] 14.5 Set up monitoring and alerting for production deployment
