'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ArrowLeft,
  Building,
  DollarSign,
  MapPin,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useScenario } from '@/hooks/useScenario';
import type { Scenario } from '@/types';

export default function ScenarioDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.id as string;

  const { scenarios } = useStore();
  const { deleteScenario } = useScenario();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scenarioId && scenarios.length > 0) {
      const foundScenario = scenarios.find(s => s.id === scenarioId);
      setScenario(foundScenario || null);
      setLoading(false);
    }
  }, [scenarioId, scenarios]);

  const handleDelete = async () => {
    if (
      scenario &&
      confirm(
        'Are you sure you want to delete this scenario? This action cannot be undone.'
      )
    ) {
      const success = await deleteScenario(scenario.id);
      if (success) {
        router.push('/dashboard');
      }
    }
  };

  const handleEdit = () => {
    if (scenario) {
      // Navigate to dashboard with edit mode
      router.push(`/dashboard?edit=${scenario.id}`);
    }
  };

  if (loading) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-lg text-muted-foreground'>
            Loading scenario...
          </div>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-foreground mb-2'>
              Scenario not found
            </h2>
            <p className='text-muted-foreground mb-4'>
              The scenario you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalMonthlyInvestment = scenario.investments.reduce(
    (sum, inv) => sum + inv.monthlyAmount,
    0
  );

  const totalAnnualInvestment = totalMonthlyInvestment * 12;

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center space-x-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Dashboard
          </Button>
          <div>
            <h1 className='text-3xl font-bold text-foreground'>
              {scenario.name}
            </h1>
            <p className='text-muted-foreground'>
              Created {scenario.createdAt.toLocaleDateString()} • Updated{' '}
              {scenario.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className='flex space-x-2'>
          <Button
            onClick={handleEdit}
            className='bg-primary hover:bg-primary/90'
          >
            <Edit className='w-4 h-4 mr-2' />
            Edit Scenario
          </Button>
          <Button variant='destructive' onClick={handleDelete}>
            <Trash2 className='w-4 h-4 mr-2' />
            Delete
          </Button>
        </div>
      </div>

      <div className='grid lg:grid-cols-2 gap-8'>
        {/* Job Offer Details */}
        <Card className='bg-card border-border'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Building className='w-5 h-5' />
              <span>Job Offer Details</span>
            </CardTitle>
            <CardDescription>
              Information about the job offer being analyzed
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <Building className='w-4 h-4 text-muted-foreground' />
              <div>
                <p className='font-medium text-foreground'>
                  {scenario.jobOffer.company}
                </p>
                <p className='text-sm text-muted-foreground'>Company</p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <TrendingUp className='w-4 h-4 text-muted-foreground' />
              <div>
                <p className='font-medium text-foreground'>
                  {scenario.jobOffer.title}
                </p>
                <p className='text-sm text-muted-foreground'>Position</p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <DollarSign className='w-4 h-4 text-muted-foreground' />
              <div>
                <p className='font-medium text-foreground'>
                  ${scenario.jobOffer.salary.toLocaleString()}
                </p>
                <p className='text-sm text-muted-foreground'>Annual Salary</p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <MapPin className='w-4 h-4 text-muted-foreground' />
              <div>
                <p className='font-medium text-foreground'>
                  {scenario.jobOffer.location}
                </p>
                <p className='text-sm text-muted-foreground'>Location</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Strategy */}
        <Card className='bg-card border-border'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <TrendingUp className='w-5 h-5' />
              <span>Investment Strategy</span>
            </CardTitle>
            <CardDescription>
              Your planned investment allocation
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Monthly Investment</span>
              <span className='font-medium text-foreground'>
                ${totalMonthlyInvestment.toLocaleString()}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Annual Investment</span>
              <span className='font-medium text-foreground'>
                ${totalAnnualInvestment.toLocaleString()}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Number of ETFs</span>
              <Badge variant='secondary'>
                {scenario.investments.length} ETFs
              </Badge>
            </div>

            <div className='pt-4 border-t border-border'>
              <h4 className='font-medium text-foreground mb-3'>
                Investment Breakdown
              </h4>
              <div className='space-y-2'>
                {scenario.investments.map((investment, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between'
                  >
                    <span className='text-sm text-muted-foreground'>
                      {investment.symbol}
                    </span>
                    <span className='text-sm font-medium text-foreground'>
                      ${investment.monthlyAmount.toLocaleString()}/month
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Analysis */}
      <Card className='mt-8 bg-card border-border'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Calendar className='w-5 h-5' />
            <span>Financial Projections</span>
          </CardTitle>
          <CardDescription>
            Estimated financial outcomes based on your investment strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-foreground'>
                ${(scenario.jobOffer.salary * 0.7).toLocaleString()}
              </p>
              <p className='text-sm text-muted-foreground'>
                Estimated Take-Home Pay (70%)
              </p>
            </div>

            <div className='text-center'>
              <p className='text-2xl font-bold text-foreground'>
                $
                {(
                  (scenario.jobOffer.salary * 0.7) / 12 -
                  totalMonthlyInvestment
                ).toLocaleString()}
              </p>
              <p className='text-sm text-muted-foreground'>
                Remaining Monthly Budget
              </p>
            </div>

            <div className='text-center'>
              <p className='text-2xl font-bold text-foreground'>
                {(
                  (totalMonthlyInvestment /
                    ((scenario.jobOffer.salary * 0.7) / 12)) *
                  100
                ).toFixed(1)}
                %
              </p>
              <p className='text-sm text-muted-foreground'>Investment Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
