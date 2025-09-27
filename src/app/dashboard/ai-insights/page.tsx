'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import AIExplanation from '@/components/AIExplanation';

export default function AIInsightsPage() {
  const { scenarios, currentScenario } = useStore();
  const [selectedInsightType, setSelectedInsightType] = useState('overview');

  const insightTypes = [
    { value: 'overview', label: 'Overview', icon: Brain },
    { value: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { value: 'risks', label: 'Risk Analysis', icon: AlertTriangle },
    { value: 'opportunities', label: 'Opportunities', icon: TrendingUp },
  ];

  const mockInsights = {
    overview: [
      {
        title: 'Portfolio Diversification',
        description:
          'Your current portfolio shows good diversification across asset classes with 60% stocks, 30% international, and 10% bonds.',
        type: 'positive',
      },
      {
        title: 'Savings Rate',
        description:
          'Your savings rate of 15% is above the recommended 10-15% for your age group.',
        type: 'positive',
      },
      {
        title: 'Emergency Fund',
        description:
          'Consider building an emergency fund of 3-6 months expenses before increasing investments.',
        type: 'warning',
      },
    ],
    recommendations: [
      {
        title: 'Increase International Exposure',
        description:
          'Consider increasing your international allocation to 40% for better global diversification.',
        type: 'suggestion',
      },
      {
        title: 'Tax-Advantaged Accounts',
        description:
          'Maximize your 401(k) contributions to take advantage of employer matching and tax benefits.',
        type: 'suggestion',
      },
      {
        title: 'Rebalancing Schedule',
        description:
          'Set up quarterly rebalancing to maintain your target asset allocation.',
        type: 'suggestion',
      },
    ],
    risks: [
      {
        title: 'Market Volatility',
        description:
          'Your portfolio may experience 20-30% volatility during market downturns. Ensure you can handle this psychologically.',
        type: 'warning',
      },
      {
        title: 'Concentration Risk',
        description:
          'Having too much in growth stocks could impact returns during market corrections.',
        type: 'warning',
      },
      {
        title: 'Inflation Risk',
        description:
          'Your bond allocation may not keep pace with inflation over the long term.',
        type: 'warning',
      },
    ],
    opportunities: [
      {
        title: 'Dollar-Cost Averaging',
        description:
          'Your consistent monthly investments will help reduce timing risk and smooth out market volatility.',
        type: 'positive',
      },
      {
        title: 'Compound Growth',
        description:
          'Starting early gives you a significant advantage. Your investments could grow to over $2M by retirement.',
        type: 'positive',
      },
      {
        title: 'Tax Efficiency',
        description:
          'Using low-cost ETFs in taxable accounts minimizes tax drag on your returns.',
        type: 'positive',
      },
    ],
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
      case 'suggestion':
        return <Target className='w-5 h-5 text-blue-500' />;
      default:
        return <Brain className='w-5 h-5 text-primary' />;
    }
  };

  const getInsightBadge = (type: string) => {
    switch (type) {
      case 'positive':
        return (
          <Badge className='bg-green-100 text-green-800 border-green-200'>
            Good
          </Badge>
        );
      case 'warning':
        return (
          <Badge className='bg-yellow-100 text-yellow-800 border-yellow-200'>
            Attention
          </Badge>
        );
      case 'suggestion':
        return (
          <Badge className='bg-blue-100 text-blue-800 border-blue-200'>
            Suggestion
          </Badge>
        );
      default:
        return <Badge variant='secondary'>Info</Badge>;
    }
  };

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Page Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>AI Insights</h1>
        <p className='text-muted-foreground'>
          Get personalized insights and recommendations based on your financial
          scenarios and investment strategy.
        </p>
      </div>

      {!currentScenario ? (
        <Card className='bg-card border-border'>
          <CardContent className='py-16 text-center'>
            <div className='w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Brain className='w-8 h-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              No scenario selected
            </h3>
            <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
              Select a scenario to get personalized AI insights and
              recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-8'>
          {/* Insight Type Selection */}
          <div className='flex flex-wrap gap-2'>
            {insightTypes.map(type => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant={
                    selectedInsightType === type.value ? 'default' : 'outline'
                  }
                  onClick={() => setSelectedInsightType(type.value)}
                  className={`flex items-center space-x-2 ${
                    selectedInsightType === type.value
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span>{type.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Current Scenario Info */}
          <Card className='bg-accent/5 border-accent/20'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-medium text-foreground'>
                    {currentScenario.name}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {currentScenario.jobOffer.company} • $
                    {currentScenario.jobOffer.salary.toLocaleString()} •{' '}
                    {currentScenario.investments.length} investments
                  </p>
                </div>
                <Badge variant='secondary'>Active Scenario</Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <div className='grid gap-6'>
            {mockInsights[
              selectedInsightType as keyof typeof mockInsights
            ]?.map((insight, index) => (
              <Card key={index} className='bg-card border-border'>
                <CardContent className='p-6'>
                  <div className='flex items-start space-x-4'>
                    <div className='flex-shrink-0 mt-1'>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center justify-between mb-2'>
                        <h4 className='font-medium text-foreground'>
                          {insight.title}
                        </h4>
                        {getInsightBadge(insight.type)}
                      </div>
                      <p className='text-muted-foreground'>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Explanation Component */}
          <Card className='bg-card border-border'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Brain className='w-5 h-5 text-primary' />
                <span>Detailed Analysis</span>
              </CardTitle>
              <CardDescription>
                AI-powered analysis of your current scenario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIExplanation scenario={currentScenario} type='scenario' />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
