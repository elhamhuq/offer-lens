'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import FinancialChart from '@/components/FinancialChart';

export default function FinancialAnalysisPage() {
  const { scenarios, loadScenarios, isAuthenticated } = useStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadScenarios();
    }
  }, [isAuthenticated, loadScenarios]);

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
          {/* Financial Chart */}
          <FinancialChart scenarios={scenarios} />
        </div>
      )}
    </div>
  );
}
