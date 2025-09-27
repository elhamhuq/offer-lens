'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import {
  Calculator,
  TrendingUp,
  Brain,
  BarChart3,
  Upload,
  Target,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { scenarios, currentScenario } = useStore();

  const navigationCards = [
    {
      title: 'Scenarios',
      description: 'View and manage your saved scenarios',
      icon: FolderOpen,
      href: '/dashboard/new-scenario',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      badge: scenarios.length.toString(),
    },
    {
      title: 'Investment Strategy',
      description: 'Plan your investment portfolio',
      icon: Target,
      href: '/dashboard/investments',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Financial Analysis',
      description: 'Analyze your financial projections',
      icon: BarChart3,
      href: '/dashboard/financial-analysis',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Compare Scenarios',
      description: 'Side-by-side scenario comparison',
      icon: Calculator,
      href: '/dashboard/compare',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'AI Insights',
      description: 'Get personalized recommendations',
      icon: Brain,
      href: '/dashboard/ai-insights',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Page Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>
          Financial Dashboard
        </h1>
        <p className='text-muted-foreground'>
          Understand how job offers and investments affect your financial future
        </p>
      </div>

      {/* Quick Stats */}
      <div className='grid md:grid-cols-4 gap-4 mb-8'>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-primary'>
              {scenarios.length}
            </div>
            <div className='text-sm text-muted-foreground'>Scenarios</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-accent'>
              ${currentScenario?.jobOffer.salary?.toLocaleString() || '0'}
            </div>
            <div className='text-sm text-muted-foreground'>Current Salary</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-chart-2'>
              $
              {currentScenario?.investments
                .reduce((sum, inv) => sum + inv.monthlyAmount, 0)
                .toLocaleString() || '0'}
            </div>
            <div className='text-sm text-muted-foreground'>
              Monthly Investment
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-chart-3'>8.2%</div>
            <div className='text-sm text-muted-foreground'>Expected Return</div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {navigationCards.map(card => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className='bg-card border-border hover:shadow-lg transition-all duration-200 cursor-pointer group'>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div
                      className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <div className='flex items-center space-x-2'>
                      {card.badge && (
                        <Badge variant='secondary'>{card.badge}</Badge>
                      )}
                      <ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors' />
                    </div>
                  </div>
                  <h3 className='font-semibold text-foreground mb-2'>
                    {card.title}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Current Scenario Summary */}
      {currentScenario && (
        <div className='mt-8'>
          <Card className='bg-accent/5 border-accent/20'>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>Current Scenario</span>
                <Badge variant='secondary'>Active</Badge>
              </CardTitle>
              <CardDescription>
                Your currently selected scenario for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid md:grid-cols-3 gap-4'>
                <div>
                  <h4 className='font-medium text-foreground mb-1'>
                    {currentScenario.name}
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    {currentScenario.jobOffer.company} •{' '}
                    {currentScenario.jobOffer.title}
                  </p>
                </div>
                <div>
                  <h4 className='font-medium text-foreground mb-1'>
                    ${currentScenario.jobOffer.salary.toLocaleString()}
                  </h4>
                  <p className='text-sm text-muted-foreground'>Annual Salary</p>
                </div>
                <div>
                  <h4 className='font-medium text-foreground mb-1'>
                    {currentScenario.investments.length} ETFs
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    $
                    {currentScenario.investments
                      .reduce((sum, inv) => sum + inv.monthlyAmount, 0)
                      .toLocaleString()}{' '}
                    monthly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
