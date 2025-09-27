# Cashflow Compass 🧭💰

A comprehensive financial decision-making tool that helps professionals evaluate job offers by combining salary analysis with investment planning and AI-powered insights.

## 🚀 Features

- **PDF Job Offer Parsing**: Upload and extract key compensation details from job offer documents
- **Investment Portfolio Optimization**: Configure investment preferences and run efficient frontier analysis
- **Financial Simulations**: Monte Carlo simulations for long-term wealth projections
- **Cost-of-Living Analysis**: Compare compensation across different cities
- **AI-Powered Explanations**: Get plain-language insights from Google Gemini API
- **Interactive Visualizations**: Beautiful charts and comparisons using ECharts

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** with shadcn/ui components
- **Framer Motion** for smooth animations
- **ECharts** for data visualization
- **Zustand** for state management

### Backend

- **Next.js API Routes** for server-side logic
- **Supabase** for authentication, database, and file storage
- **Google Gemini API** for AI explanations
- **PDF parsing** for job offer extraction

### Development Tools

- **ESLint** and **Prettier** for code quality
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cashflow-compass
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and fill in your credentials:

```bash
cp env.example .env.local
```

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
cashflow-compass/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                  # Utility functions
│   │   ├── supabase.ts       # Supabase client
│   │   ├── gemini.ts         # Gemini API client
│   │   └── utils.ts          # General utilities
│   ├── store/                # Zustand stores
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
├── tasks/                    # Project documentation
├── components.json           # shadcn/ui configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── next.config.js           # Next.js configuration
```

## 🎯 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Formatting
npx prettier --write .  # Format all files
```

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Create the following tables:

```sql
-- Users table (handled by Supabase Auth)
-- Scenarios table
CREATE TABLE scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  salary DECIMAL NOT NULL,
  expenses_json JSONB NOT NULL,
  city TEXT NOT NULL
);

-- Runs table
CREATE TABLE runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  weights_json JSONB NOT NULL,
  metrics_json JSONB NOT NULL
);
```

### Google Gemini API

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env.local` file

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add TypeScript types for all new functions and components
- Test your changes thoroughly
- Update documentation as needed

## 🐛 Troubleshooting

### Common Issues

**Build Errors**

- Ensure all environment variables are set
- Run `npm install` to ensure dependencies are installed
- Check TypeScript errors with `npm run type-check`

**Supabase Connection Issues**

- Verify your Supabase URL and keys
- Check that RLS policies are properly configured
- Ensure your database tables exist

**PDF Parsing Issues**

- Verify file size is under 10MB
- Ensure PDF is not password-protected
- Check that the PDF contains readable text

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Google Gemini](https://ai.google.dev/) for AI-powered insights

---

**Built with ❤️ for better financial decision-making**
