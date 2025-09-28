'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Loader2,
  BarChart3,
  PieChart,
  Target,
  DollarSign,
} from 'lucide-react';
import type { Investment } from '@/types';

interface SimulationResults {
  portfolioPaths: number[][];
  individualPaths: { [ticker: string]: number[][] };
  finalValues: number[];
  returns: number[];
  percentiles: {
    p5: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p95: number[];
  };
  riskMetrics: {
    meanReturn: number;
    medianReturn: number;
    probNegative: number;
    var5: number;
    var1: number;
    cvar5: number;
    volatility: number;
  };
  statistics: {
    expectedFinalValue: number;
    minFinalValue: number;
    maxFinalValue: number;
    bestReturn: number;
    worstReturn: number;
  };
  individualStockResults: {
    [ticker: string]: {
      meanReturn: number;
      volatility: number;
      finalValue: number;
    };
  };
  portfolioComposition: {
    [ticker: string]: {
      allocation_pct: number;
      allocation_dollar: number;
      shares: number;
      current_price: number;
    };
  };
}

interface PortfolioSimulationProps {
  investments: Investment[];
  onClose?: () => void;
}

export default function PortfolioSimulation({
  investments,
  onClose,
}: PortfolioSimulationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    if (investments.length === 0) {
      setError('No investments to simulate');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const positions = investments.map(inv => ({
        ticker: inv.etfTicker,
        dollarAmount: inv.monthlyAmount * 12, // Convert monthly to annual
      }));

      const response = await fetch('/api/portfolio-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positions,
          horizonYears: 1,
          numSimulations: 5000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Simulation failed');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (investments.length > 0) {
      runSimulation();
    }
  }, [investments]);

  const getRiskColor = (prob: number) => {
    if (prob < 0.1) return 'text-green-600';
    if (prob < 0.2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLabel = (prob: number) => {
    if (prob < 0.1) return 'Low Risk';
    if (prob < 0.2) return 'Medium Risk';
    return 'High Risk';
  };

  if (investments.length === 0) {
    return (
      <Card className='bg-card border-border'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <BarChart3 className='w-5 h-5 text-primary' />
            <span>Portfolio Simulation</span>
          </CardTitle>
          <CardDescription>
            Add investments to see Monte Carlo simulation results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className='w-4 h-4' />
            <AlertDescription>
              Please add at least one investment to run the portfolio
              simulation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='bg-card border-border'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center space-x-2'>
              <BarChart3 className='w-5 h-5 text-primary' />
              <span>Portfolio Simulation</span>
            </CardTitle>
            <CardDescription>
              Monte Carlo analysis of your investment portfolio over 1 year
            </CardDescription>
          </div>
          {onClose && (
            <Button variant='ghost' size='sm' onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {isLoading && (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='w-8 h-8 animate-spin text-primary' />
            <span className='ml-2'>Running simulation...</span>
          </div>
        )}

        {error && (
          <Alert variant='destructive'>
            <AlertTriangle className='w-4 h-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <>
            {/* Portfolio Composition */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-foreground'>
                Portfolio Composition
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {Object.entries(results.portfolioComposition).map(
                  ([ticker, comp]) => (
                    <Card key={ticker} className='bg-muted/30 border-border'>
                      <CardContent className='p-4'>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <span className='font-medium text-foreground'>
                              {ticker}
                            </span>
                            <Badge variant='secondary'>
                              {comp.allocation_pct.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            <div>
                              ${comp.allocation_dollar.toLocaleString()}{' '}
                              allocated
                            </div>
                            <div>
                              {comp.shares.toFixed(2)} shares @ $
                              {comp.current_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>

            {/* Risk Metrics */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-foreground'>Risk Analysis</h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <Card className='bg-muted/30 border-border'>
                  <CardContent className='p-4 text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <Target className='w-4 h-4 text-primary' />
                      <span className='text-sm font-medium text-foreground'>
                        Expected Return
                      </span>
                    </div>
                    <p className='text-lg font-bold text-foreground'>
                      {(results.riskMetrics.meanReturn * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className='bg-muted/30 border-border'>
                  <CardContent className='p-4 text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <Shield className='w-4 h-4 text-accent' />
                      <span className='text-sm font-medium text-foreground'>
                        Volatility
                      </span>
                    </div>
                    <p className='text-lg font-bold text-foreground'>
                      {(results.riskMetrics.volatility * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className='bg-muted/30 border-border'>
                  <CardContent className='p-4 text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <TrendingDown className='w-4 h-4 text-destructive' />
                      <span className='text-sm font-medium text-foreground'>
                        Prob. of Loss
                      </span>
                    </div>
                    <p
                      className={`text-lg font-bold ${getRiskColor(results.riskMetrics.probNegative)}`}
                    >
                      {(results.riskMetrics.probNegative * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className='bg-muted/30 border-border'>
                  <CardContent className='p-4 text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <AlertTriangle className='w-4 h-4 text-orange-500' />
                      <span className='text-sm font-medium text-foreground'>
                        5% VaR
                      </span>
                    </div>
                    <p className='text-lg font-bold text-foreground'>
                      {(results.riskMetrics.var5 * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Portfolio Projections */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-foreground'>
                Portfolio Projections
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Card className='bg-muted/30 border-border'>
                  <CardContent className='p-4 text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <DollarSign className='w-4 h-4 text-green-600' />
                      <span className='text-sm font-medium text-foreground'>
                        Expected Value
                      </span>
                    </div>
                    <p className='text-xl font-bold text-green-600'>
                      ${results.statistics.expectedFinalValue.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className='bg-muted/30 border-border'>
                  <CardContent className='p-4 text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <TrendingUp className='w-4 h-4 text-blue-600' />
                      <span className='text-sm font-medium text-foreground'>
                        Best Case
                      </span>
                    </div>
                    <p className='text-xl font-bold text-blue-600'>
                      ${results.statistics.maxFinalValue.toLocaleString()}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      +{(results.statistics.bestReturn * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className='bg-muted/30 border-border'>
                  <CardContent className='p-4 text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <TrendingDown className='w-4 h-4 text-red-600' />
                      <span className='text-sm font-medium text-foreground'>
                        Worst Case
                      </span>
                    </div>
                    <p className='text-xl font-bold text-red-600'>
                      ${results.statistics.minFinalValue.toLocaleString()}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {(results.statistics.worstReturn * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Individual Stock Performance */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-foreground'>
                Individual Stock Analysis
              </h3>
              <div className='space-y-3'>
                {Object.entries(results.individualStockResults).map(
                  ([ticker, stockResults]) => (
                    <Card key={ticker} className='bg-muted/30 border-border'>
                      <CardContent className='p-4'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <span className='font-medium text-foreground'>
                              {ticker}
                            </span>
                            <Badge variant='secondary'>
                              {getRiskLabel(stockResults.volatility)}
                            </Badge>
                          </div>
                          <div className='text-right'>
                            <div className='text-lg font-bold text-foreground'>
                              {(stockResults.meanReturn * 100).toFixed(1)}%
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              ±{(stockResults.volatility * 100).toFixed(1)}%
                              volatility
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>

            {/* Summary */}
            <div className='p-4 bg-muted/30 rounded-lg'>
              <h4 className='font-medium text-foreground mb-2'>
                Simulation Summary
              </h4>
              <div className='text-sm text-muted-foreground space-y-1'>
                <p>
                  • Based on {investments.length} investments with 5,000 Monte
                  Carlo simulations
                </p>
                <p>
                  • Portfolio expected return:{' '}
                  {(results.riskMetrics.meanReturn * 100).toFixed(1)}% annually
                </p>
                <p>
                  • Risk level: {getRiskLabel(results.riskMetrics.probNegative)}{' '}
                  ({(results.riskMetrics.probNegative * 100).toFixed(1)}% chance
                  of loss)
                </p>
                <p>
                  • 95% confidence interval:{' '}
                  {(results.riskMetrics.var5 * 100).toFixed(1)}% to{' '}
                  {(results.statistics.bestReturn * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className='flex justify-center'>
              <Button
                onClick={runSimulation}
                disabled={isLoading}
                variant='outline'
                className='w-full md:w-auto'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Running Simulation...
                  </>
                ) : (
                  'Refresh Simulation'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
