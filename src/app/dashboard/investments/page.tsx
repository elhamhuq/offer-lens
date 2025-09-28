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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Calculator, Target, DollarSign, Save } from 'lucide-react';
import Link from 'next/link';
import InvestmentForm from '@/components/InvestmentForm';
import FinancialChart from '@/components/FinancialChart';
import type { Investment } from '@/types';

export default function InvestmentsPage() {
  const [monthlyIncome, setMonthlyIncome] = useState(12500); // $150k annual
  const [monthlyExpenses, setMonthlyExpenses] = useState(8000);
  const [investmentGoal, setInvestmentGoal] = useState('retirement');
  const [timeHorizon, setTimeHorizon] = useState('30');
  const [investments, setInvestments] = useState<Investment[]>([]);

  const availableBudget = monthlyIncome - monthlyExpenses;
  const currentInvestments = investments.reduce(
    (sum, inv) => sum + inv.monthlyAmount,
    0
  );
  const savingsRate =
    monthlyIncome > 0 ? (currentInvestments / monthlyIncome) * 100 : 0;

  const handleInvestmentsChange = (newInvestments: Investment[]) => {
    setInvestments(newInvestments);
  };

  const savePortfolio = () => {
    // Mock save functionality
    console.log('Saving portfolio:', investments);
  };

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Page Header */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Investment Planning
          </h1>
          <p className='text-muted-foreground'>
            Set up your investment portfolio and see how it affects your
            long-term financial goals.
          </p>
        </div>
        <Button
          onClick={savePortfolio}
          className='bg-primary hover:bg-primary/90'
        >
          <Save className='w-4 h-4 mr-2' />
          Save Portfolio
        </Button>
      </div>

      {/* Content Area */}
      <div>
        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Financial Overview */}
            <Card className='bg-card border-border'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <DollarSign className='w-5 h-5 text-primary' />
                  <span>Financial Overview</span>
                </CardTitle>
                <CardDescription>
                  Set your income and expenses to determine investment capacity
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='income'>Monthly Take-Home Income</Label>
                    <Input
                      id='income'
                      type='number'
                      value={monthlyIncome}
                      onChange={e => setMonthlyIncome(Number(e.target.value))}
                      placeholder='12500'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='expenses'>Monthly Expenses</Label>
                    <Input
                      id='expenses'
                      type='number'
                      value={monthlyExpenses}
                      onChange={e => setMonthlyExpenses(Number(e.target.value))}
                      placeholder='8000'
                    />
                  </div>
                </div>

                <div className='grid md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='goal'>Investment Goal</Label>
                    <Select
                      value={investmentGoal}
                      onValueChange={setInvestmentGoal}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='retirement'>Retirement</SelectItem>
                        <SelectItem value='house'>
                          House Down Payment
                        </SelectItem>
                        <SelectItem value='education'>
                          Education Fund
                        </SelectItem>
                        <SelectItem value='general'>
                          General Wealth Building
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='horizon'>Time Horizon</Label>
                    <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='10'>10 years</SelectItem>
                        <SelectItem value='20'>20 years</SelectItem>
                        <SelectItem value='30'>30 years</SelectItem>
                        <SelectItem value='40'>40 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Budget Summary */}
                <div className='grid grid-cols-3 gap-4 pt-4 border-t border-border'>
                  <div className='text-center'>
                    <p className='text-sm text-muted-foreground'>
                      Available Budget
                    </p>
                    <p className='text-lg font-bold text-foreground'>
                      ${availableBudget.toLocaleString()}
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-sm text-muted-foreground'>
                      Current Investments
                    </p>
                    <p className='text-lg font-bold text-accent'>
                      ${currentInvestments.toLocaleString()}
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-sm text-muted-foreground'>
                      Savings Rate
                    </p>
                    <p className='text-lg font-bold text-chart-2'>
                      {savingsRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Investment Form */}
            <InvestmentForm
              onInvestmentsChange={handleInvestmentsChange}
              monthlyBudget={availableBudget}
              initialInvestments={investments}
            />
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Quick Stats */}
            <Card className='bg-card border-border'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <Target className='w-5 h-5 text-primary' />
                  <span>Portfolio Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      Monthly Investment
                    </span>
                    <span className='font-medium text-foreground'>
                      ${currentInvestments.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      Annual Investment
                    </span>
                    <span className='font-medium text-foreground'>
                      ${(currentInvestments * 12).toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      Savings Rate
                    </span>
                    <span className='font-medium text-foreground'>
                      {savingsRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      Time Horizon
                    </span>
                    <span className='font-medium text-foreground'>
                      {timeHorizon} years
                    </span>
                  </div>
                </div>

                <div className='pt-4 border-t border-border'>
                  <div className='text-center space-y-1'>
                    <p className='text-sm text-muted-foreground'>
                      Projected Value
                    </p>
                    <p className='text-2xl font-bold text-accent'>
                      $
                      {(
                        (currentInvestments *
                          12 *
                          Number.parseInt(timeHorizon) *
                          1.082) **
                        1
                      ).toLocaleString()}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Assuming 8.2% annual return
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Investment Tips */}
            <Card className='bg-card border-border'>
              <CardHeader>
                <CardTitle className='text-lg'>Investment Tips</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='p-3 rounded-lg bg-accent/10 border border-accent/20'>
                    <p className='text-sm font-medium text-foreground mb-1'>
                      Diversification
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Spread investments across different asset classes to
                      reduce risk.
                    </p>
                  </div>

                  <div className='p-3 rounded-lg bg-primary/10 border border-primary/20'>
                    <p className='text-sm font-medium text-foreground mb-1'>
                      Dollar-Cost Averaging
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Invest consistently regardless of market conditions to
                      reduce timing risk.
                    </p>
                  </div>

                  <div className='p-3 rounded-lg bg-chart-2/10 border border-chart-2/20'>
                    <p className='text-sm font-medium text-foreground mb-1'>
                      Low Fees
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Choose ETFs with low expense ratios to maximize long-term
                      returns.
                    </p>
                  </div>

                  <div className='p-3 rounded-lg bg-chart-4/10 border border-chart-4/20'>
                    <p className='text-sm font-medium text-foreground mb-1'>
                      Emergency Fund First
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Ensure you have 3-6 months of expenses saved before
                      aggressive investing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Allocation */}
            <Card className='bg-muted/30 border-border'>
              <CardHeader>
                <CardTitle className='text-lg'>
                  Recommended Allocation
                </CardTitle>
                <CardDescription>
                  Based on your age and risk tolerance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-foreground'>
                      US Total Market (VTI)
                    </span>
                    <span className='text-sm font-medium text-foreground'>
                      60%
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-foreground'>
                      International (VXUS)
                    </span>
                    <span className='text-sm font-medium text-foreground'>
                      30%
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-foreground'>Bonds (BND)</span>
                    <span className='text-sm font-medium text-foreground'>
                      10%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Financial Projection Chart */}
        {currentInvestments > 0 && (
          <div className='mt-8'>
            <FinancialChart
              title='Investment Projection'
              description={`Your portfolio growth over ${timeHorizon} years`}
              timeHorizon={Number.parseInt(timeHorizon)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
