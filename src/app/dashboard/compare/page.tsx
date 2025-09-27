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
import { ArrowLeft, BarChart3, Plus } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import ScenarioComparison from '@/components/ScenarioComparison';
import AIExplanation from '@/components/AIExplanation';

export default function ComparePage() {
  const { scenarios } = useStore();
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  // Mock scenarios if none exist
  const mockScenarios =
    scenarios.length > 0
      ? scenarios
      : [
          {
            id: '1',
            name: 'TechCorp SF',
            jobOffer: {
              id: '1',
              title: 'Senior Software Engineer',
              company: 'TechCorp',
              salary: 180000,
              location: 'San Francisco, CA',
              benefits: ['Health Insurance', '401k Match', 'Stock Options'],
              uploadedAt: new Date(),
            },
            investments: [
              {
                id: '1',
                name: 'S&P 500 Index',
                monthlyAmount: 1200,
                etfTicker: 'SPY',
                riskLevel: 'medium' as const,
              },
              {
                id: '2',
                name: 'Total International',
                monthlyAmount: 600,
                etfTicker: 'VXUS',
                riskLevel: 'medium' as const,
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'StartupXYZ Austin',
            jobOffer: {
              id: '2',
              title: 'Senior Product Manager',
              company: 'StartupXYZ',
              salary: 150000,
              location: 'Austin, TX',
              benefits: ['Health Insurance', 'Flexible PTO', 'Remote Work'],
              uploadedAt: new Date(),
            },
            investments: [
              {
                id: '3',
                name: 'Total Stock Market',
                monthlyAmount: 1500,
                etfTicker: 'VTI',
                riskLevel: 'medium' as const,
              },
              {
                id: '4',
                name: 'Bond Index',
                monthlyAmount: 300,
                etfTicker: 'BND',
                riskLevel: 'low' as const,
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Page Header */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Compare Scenarios
          </h1>
          <p className='text-muted-foreground'>
            Analyze multiple job offers and investment strategies side-by-side
            to make informed decisions.
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            onClick={() => setShowAIAnalysis(!showAIAnalysis)}
            className='bg-transparent'
          >
            {showAIAnalysis ? 'Hide' : 'Show'} AI Analysis
          </Button>
          <Link href='/dashboard/new-scenario'>
            <Button className='bg-primary hover:bg-primary/90'>
              <Plus className='w-4 h-4 mr-2' />
              New Scenario
            </Button>
          </Link>
        </div>
      </div>

      <div className='space-y-8'>
        {/* Main Comparison */}
        <ScenarioComparison
          scenarios={mockScenarios}
          onAddScenario={() => {
            // Navigate to new scenario creation
            window.location.href = '/dashboard/new-scenario';
          }}
        />

        {/* AI Analysis */}
        {showAIAnalysis && (
          <AIExplanation
            type='comparison'
            scenario={{
              jobOffer: mockScenarios[0]?.jobOffer || {
                company: 'TechCorp',
                salary: 180000,
                location: 'San Francisco, CA',
              },
              investments: mockScenarios[0]?.investments || [],
            }}
          />
        )}

        {/* Quick Actions */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Card className='bg-card border-border hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='text-lg'>Create New Scenario</CardTitle>
              <CardDescription>
                Add another job offer and investment strategy to compare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/dashboard/new-scenario'>
                <Button className='w-full bg-primary hover:bg-primary/90'>
                  <Plus className='w-4 h-4 mr-2' />
                  Create Scenario
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className='bg-card border-border hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='text-lg'>Upload Job Offer</CardTitle>
              <CardDescription>
                Upload a PDF or document to extract job details automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/dashboard/upload'>
                <Button variant='outline' className='w-full bg-transparent'>
                  Upload Document
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className='bg-card border-border hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='text-lg'>Investment Planning</CardTitle>
              <CardDescription>
                Optimize your investment strategy for better long-term outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/dashboard/investments'>
                <Button variant='outline' className='w-full bg-transparent'>
                  Plan Investments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Tips for Better Comparisons */}
        <Card className='bg-muted/30 border-border'>
          <CardHeader>
            <CardTitle className='text-lg'>
              Tips for Better Comparisons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid md:grid-cols-2 gap-6'>
              <div className='space-y-3'>
                <h4 className='font-medium text-foreground'>
                  Consider All Factors
                </h4>
                <ul className='text-sm text-muted-foreground space-y-1'>
                  <li>• Cost of living differences between locations</li>
                  <li>• Career growth opportunities and learning potential</li>
                  <li>• Company culture and work-life balance</li>
                  <li>• Benefits beyond salary (health, retirement, equity)</li>
                </ul>
              </div>
              <div className='space-y-3'>
                <h4 className='font-medium text-foreground'>
                  Long-term Perspective
                </h4>
                <ul className='text-sm text-muted-foreground space-y-1'>
                  <li>• Investment growth compounds over time</li>
                  <li>• Higher savings rate often beats higher salary</li>
                  <li>• Consider promotion potential and salary increases</li>
                  <li>• Factor in life changes and family planning</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
