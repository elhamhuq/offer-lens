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
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Calculator,
  PieChart,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import FinancialChart from '@/components/FinancialChart';

export default function FinancialAnalysisPage() {
  const { scenarios, currentScenario } = useStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState('10');

  const timeframes = [
    { value: '5', label: '5 Years' },
    { value: '10', label: '10 Years' },
    { value: '20', label: '20 Years' },
    { value: '30', label: '30 Years' },
  ];

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Page Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>
          Financial Analysis
        </h1>
        <p className='text-muted-foreground'>
          Analyze your financial projections and investment performance across
          different scenarios.
        </p>
      </div>

      {scenarios.length === 0 ? (
        <Card className='bg-card border-border'>
          <CardContent className='py-16 text-center'>
            <div className='w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4'>
              <BarChart3 className='w-8 h-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              No scenarios to analyze
            </h3>
            <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
              Create your first scenario to start analyzing your financial
              projections.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-8'>
          {/* Timeframe Selection */}
          <div className='flex justify-center'>
            <div className='flex space-x-2'>
              {timeframes.map(timeframe => (
                <Button
                  key={timeframe.value}
                  variant={
                    selectedTimeframe === timeframe.value
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => setSelectedTimeframe(timeframe.value)}
                  className={
                    selectedTimeframe === timeframe.value
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-transparent'
                  }
                >
                  {timeframe.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className='grid md:grid-cols-4 gap-6'>
            <Card className='bg-card border-border'>
              <CardContent className='p-6'>
                <div className='flex items-center space-x-2 mb-2'>
                  <DollarSign className='w-5 h-5 text-primary' />
                  <span className='text-sm font-medium text-muted-foreground'>
                    Total Investment
                  </span>
                </div>
                <div className='text-2xl font-bold text-foreground'>
                  $
                  {currentScenario?.investments
                    .reduce((sum, inv) => sum + inv.monthlyAmount, 0)
                    .toLocaleString() || '0'}
                </div>
                <p className='text-xs text-muted-foreground'>per month</p>
              </CardContent>
            </Card>

            <Card className='bg-card border-border'>
              <CardContent className='p-6'>
                <div className='flex items-center space-x-2 mb-2'>
                  <TrendingUp className='w-5 h-5 text-accent' />
                  <span className='text-sm font-medium text-muted-foreground'>
                    Projected Value
                  </span>
                </div>
                <div className='text-2xl font-bold text-foreground'>
                  $
                  {currentScenario
                    ? (
                        (currentScenario.investments.reduce(
                          (sum, inv) => sum + inv.monthlyAmount,
                          0
                        ) *
                          12 *
                          parseInt(selectedTimeframe) *
                          1.082) **
                        1
                      ).toLocaleString()
                    : '0'}
                </div>
                <p className='text-xs text-muted-foreground'>
                  in {selectedTimeframe} years
                </p>
              </CardContent>
            </Card>

            <Card className='bg-card border-border'>
              <CardContent className='p-6'>
                <div className='flex items-center space-x-2 mb-2'>
                  <Target className='w-5 h-5 text-chart-2' />
                  <span className='text-sm font-medium text-muted-foreground'>
                    Annual Return
                  </span>
                </div>
                <div className='text-2xl font-bold text-foreground'>8.2%</div>
                <p className='text-xs text-muted-foreground'>expected</p>
              </CardContent>
            </Card>

            <Card className='bg-card border-border'>
              <CardContent className='p-6'>
                <div className='flex items-center space-x-2 mb-2'>
                  <PieChart className='w-5 h-5 text-chart-3' />
                  <span className='text-sm font-medium text-muted-foreground'>
                    Diversification
                  </span>
                </div>
                <div className='text-2xl font-bold text-foreground'>
                  {currentScenario?.investments.length || 0}
                </div>
                <p className='text-xs text-muted-foreground'>ETFs</p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Chart */}
          <Card className='bg-card border-border'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <BarChart3 className='w-5 h-5 text-primary' />
                <span>Investment Growth Projection</span>
              </CardTitle>
              <CardDescription>
                See how your investments are projected to grow over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialChart
                title='Portfolio Growth'
                description={`Your investment growth over ${selectedTimeframe} years`}
                timeHorizon={parseInt(selectedTimeframe)}
              />
            </CardContent>
          </Card>

          {/* Scenario Comparison */}
          {scenarios.length > 1 && (
            <Card className='bg-card border-border'>
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
                <CardDescription>
                  Compare the financial projections across your scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {scenarios.map(scenario => {
                    const monthlyInvestment = scenario.investments.reduce(
                      (sum, inv) => sum + inv.monthlyAmount,
                      0
                    );
                    const projectedValue =
                      monthlyInvestment *
                      12 *
                      parseInt(selectedTimeframe) *
                      1.082;

                    return (
                      <div
                        key={scenario.id}
                        className='flex items-center justify-between p-4 rounded-lg border border-border'
                      >
                        <div>
                          <h4 className='font-medium text-foreground'>
                            {scenario.name}
                          </h4>
                          <p className='text-sm text-muted-foreground'>
                            ${scenario.jobOffer.salary.toLocaleString()} •{' '}
                            {scenario.jobOffer.company}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='font-medium text-foreground'>
                            ${projectedValue.toLocaleString()}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            ${monthlyInvestment.toLocaleString()}/month
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
