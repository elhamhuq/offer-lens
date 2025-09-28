import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Upload,
  Calculator,
  TrendingUp,
  Brain,
  Shield,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import AnimatedPortfolioChart from '@/components/AnimatedPortfolioChart';

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-background'>
      {/* Navigation */}
      <nav className='border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-5 h-5 text-primary-foreground' />
              </div>
              <span className='text-xl font-bold text-foreground'>
                Cashflow Compass
              </span>
            </div>
            <div className='hidden md:flex items-center space-x-8'>
              <a
                href='#features'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                Features
              </a>
              <a
                href='#how-it-works'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                How it Works
              </a>
              <a
                href='#pricing'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                Pricing
              </a>
            </div>
            <div className='flex items-center space-x-4'>
              <Link href='/auth/login'>
                <Button
                  variant='ghost'
                  className='text-muted-foreground hover:text-foreground'
                >
                  Sign In
                </Button>
              </Link>
              <Link href='/auth/signup'>
                <Button className='bg-primary hover:bg-primary/90'>
                  Get Started
                  <ArrowRight className='ml-2 w-4 h-4' />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-8'>
              <div className='inline-flex items-center px-3 py-1 rounded-full bg-accent/10 border border-accent/20'>
                <span className='text-sm font-medium text-accent'>
                  New: AI-powered explanations
                </span>
              </div>

              <div className='space-y-6'>
                <h1 className='text-4xl lg:text-6xl font-bold text-foreground leading-tight text-balance'>
                  Navigate your financial future with confidence
                </h1>
                <p className='text-xl text-muted-foreground leading-relaxed text-pretty'>
                  Upload job offers, simulate investments, and get AI-powered
                  insights to make the smartest career and financial decisions.
                </p>
              </div>

              <div className='flex flex-col sm:flex-row gap-4'>
                <Link href='/dashboard'>
                  <Button
                    size='lg'
                    className='bg-primary hover:bg-primary/90 text-primary-foreground px-8'
                  >
                    Start Planning Free
                    <ArrowRight className='ml-2 w-5 h-5' />
                  </Button>
                </Link>
                <Button
                  size='lg'
                  variant='outline'
                  className='px-8 bg-transparent'
                >
                  Watch Demo
                </Button>
              </div>

              <div className='flex items-center space-x-8 text-sm text-muted-foreground'>
                <div className='flex items-center space-x-2'>
                  <Shield className='w-4 h-4' />
                  <span>Bank-level security</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Zap className='w-4 h-4' />
                  <span>Instant analysis</span>
                </div>
              </div>
            </div>

            <div className='relative'>
              <div className='relative z-10'>
                <Card className='bg-card border-border shadow-2xl'>
                  <CardContent className='p-6'>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <h3 className='font-semibold text-foreground'>
                          Portfolio Projection
                        </h3>
                        <span className='text-sm text-muted-foreground'>
                          30 years
                        </span>
                      </div>
                      <div className='space-y-2'>
                        <div className='text-3xl font-bold text-accent'>
                          $2.3M
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          Projected portfolio value
                        </div>
                      </div>
                      <div className='h-32 rounded-lg overflow-hidden'>
                        <AnimatedPortfolioChart className='h-full' />
                      </div>
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <div className='text-muted-foreground'>
                            Monthly Investment
                          </div>
                          <div className='font-semibold text-foreground'>
                            $1,500
                          </div>
                        </div>
                        <div>
                          <div className='text-muted-foreground'>
                            Expected Return
                          </div>
                          <div className='font-semibold text-accent'>8.2%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className='absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 rounded-3xl blur-3xl -z-10'></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='py-24 bg-muted/30'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center space-y-4 mb-16'>
            <h2 className='text-3xl lg:text-4xl font-bold text-foreground text-balance'>
              Everything you need to plan your financial future
            </h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto text-pretty'>
              From job offer analysis to investment projections, get the
              complete picture of your financial decisions.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <Card className='bg-card border-border hover:shadow-lg transition-shadow'>
              <CardContent className='p-6 space-y-4'>
                <div className='w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center'>
                  <Upload className='w-6 h-6 text-accent' />
                </div>
                <h3 className='text-xl font-semibold text-foreground'>
                  Smart Job Analysis
                </h3>
                <p className='text-muted-foreground'>
                  Upload job offers and get instant analysis of take-home pay
                  adjusted for cost of living.
                </p>
              </CardContent>
            </Card>

            <Card className='bg-card border-border hover:shadow-lg transition-shadow'>
              <CardContent className='p-6 space-y-4'>
                <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center'>
                  <Calculator className='w-6 h-6 text-primary' />
                </div>
                <h3 className='text-xl font-semibold text-foreground'>
                  Investment Modeling
                </h3>
                <p className='text-muted-foreground'>
                  Model ETF portfolios and see how different investment
                  strategies affect your long-term wealth.
                </p>
              </CardContent>
            </Card>

            <Card className='bg-card border-border hover:shadow-lg transition-shadow'>
              <CardContent className='p-6 space-y-4'>
                <div className='w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center'>
                  <TrendingUp className='w-6 h-6 text-chart-2' />
                </div>
                <h3 className='text-xl font-semibold text-foreground'>
                  Visual Projections
                </h3>
                <p className='text-muted-foreground'>
                  Interactive charts show your financial trajectory over 10, 20,
                  or 30 years with different scenarios.
                </p>
              </CardContent>
            </Card>

            <Card className='bg-card border-border hover:shadow-lg transition-shadow'>
              <CardContent className='p-6 space-y-4'>
                <div className='w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center'>
                  <Brain className='w-6 h-6 text-chart-3' />
                </div>
                <h3 className='text-xl font-semibold text-foreground'>
                  AI Explanations
                </h3>
                <p className='text-muted-foreground'>
                  Get plain-English explanations of complex financial concepts
                  and personalized recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className='bg-card border-border hover:shadow-lg transition-shadow'>
              <CardContent className='p-6 space-y-4'>
                <div className='w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center'>
                  <Shield className='w-6 h-6 text-chart-4' />
                </div>
                <h3 className='text-xl font-semibold text-foreground'>
                  Scenario Comparison
                </h3>
                <p className='text-muted-foreground'>
                  Compare multiple job offers and investment strategies
                  side-by-side to make informed decisions.
                </p>
              </CardContent>
            </Card>

            <Card className='bg-card border-border hover:shadow-lg transition-shadow'>
              <CardContent className='p-6 space-y-4'>
                <div className='w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center'>
                  <Zap className='w-6 h-6 text-chart-5' />
                </div>
                <h3 className='text-xl font-semibold text-foreground'>
                  Export Reports
                </h3>
                <p className='text-muted-foreground'>
                  Generate beautiful decision cards and reports to share with
                  advisors or keep for your records.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id='how-it-works' className='py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center space-y-4 mb-16'>
            <h2 className='text-3xl lg:text-4xl font-bold text-foreground text-balance'>
              Simple process, powerful insights
            </h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto text-pretty'>
              Get started in minutes and make better financial decisions for
              life.
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto'>
                <span className='text-2xl font-bold text-accent'>1</span>
              </div>
              <h3 className='text-xl font-semibold text-foreground'>
                Upload & Analyze
              </h3>
              <p className='text-muted-foreground'>
                Upload your job offers and let our AI extract salary, benefits,
                and location data automatically.
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto'>
                <span className='text-2xl font-bold text-primary'>2</span>
              </div>
              <h3 className='text-xl font-semibold text-foreground'>
                Plan Investments
              </h3>
              <p className='text-muted-foreground'>
                Set your investment goals and choose from popular ETF portfolios
                or create your own strategy.
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-chart-2/10 rounded-full flex items-center justify-center mx-auto'>
                <span className='text-2xl font-bold text-chart-2'>3</span>
              </div>
              <h3 className='text-xl font-semibold text-foreground'>
                Compare & Decide
              </h3>
              <p className='text-muted-foreground'>
                See visual projections and AI explanations to understand which
                path leads to your financial goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-24 bg-gradient-to-r from-primary/5 to-accent/5'>
        <div className='max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8'>
          <div className='space-y-8'>
            <h2 className='text-3xl lg:text-4xl font-bold text-foreground text-balance'>
              Ready to take control of your financial future?
            </h2>
            <p className='text-xl text-muted-foreground text-pretty'>
              Join thousands of professionals who use Cashflow Compass to make
              smarter career and investment decisions.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/dashboard'>
                <Button
                  size='lg'
                  className='bg-primary hover:bg-primary/90 text-primary-foreground px-8'
                >
                  Start Free Trial
                  <ArrowRight className='ml-2 w-5 h-5' />
                </Button>
              </Link>
              <Button
                size='lg'
                variant='outline'
                className='px-8 bg-transparent'
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-border bg-muted/30'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='grid md:grid-cols-4 gap-8'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
                  <TrendingUp className='w-5 h-5 text-primary-foreground' />
                </div>
                <span className='text-xl font-bold text-foreground'>
                  Cashflow Compass
                </span>
              </div>
              <p className='text-muted-foreground'>
                Navigate your financial future with confidence.
              </p>
            </div>

            <div className='space-y-4'>
              <h4 className='font-semibold text-foreground'>Product</h4>
              <div className='space-y-2 text-sm'>
                <a
                  href='#'
                  className='block text-muted-foreground hover:text-foreground transition-colors'
                >
                  Features
                </a>
                <a
                  href='#'
                  className='block text-muted-foreground hover:text-foreground transition-colors'
                >
                  Pricing
                </a>
                <a
                  href='#'
                  className='block text-muted-foreground hover:text-foreground transition-colors'
                >
                  Security
                </a>
              </div>
            </div>

            <div className='space-y-4'>
              <h4 className='font-semibold text-foreground'>Company</h4>
              <div className='space-y-2 text-sm'>
                <a
                  href='#'
                  className='block text-muted-foreground hover:text-foreground transition-colors'
                >
                  About
                </a>
                <a
                  href='#'
                  className='block text-muted-foreground hover:text-foreground transition-colors'
                >
                  Blog
                </a>
                <a
                  href='#'
                  className='block text-muted-foreground hover:text-foreground transition-colors'
                >
                  Careers
                </a>
              </div>
            </div>

            <div className='space-y-4'>
              <h4 className='font-semibold text-foreground'>Support</h4>
              <div className='space-y-2 text-sm'>
                <a
                  href='#'
                  className='block text-muted-foreground hover:text-foreground transition-colors'
                >
                  Help Center
                </a>
                <a
                  href='#'
                  className='block text-muted-foreground hover:text-foreground transition-colors'
                >
                  Contact
                </a>
                <a
                  href='#'
                  className='block text-muted-foreground hover:text-foreground transition-colors'
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>

          <div className='border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground'>
            <p>&copy; 2025 Cashflow Compass. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
