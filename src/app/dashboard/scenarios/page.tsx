'use client';

import { useStore } from '@/store/useStore';
import { useScenario } from '@/hooks/useScenario';
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
  TrendingUp,
  Plus,
  MoreHorizontal,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function ScenariosPage() {
  const { scenarios } = useStore();
  const { deleteScenario } = useScenario();

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Page Header */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Your Scenarios
          </h1>
          <p className='text-muted-foreground'>
            Compare different job offers and investment strategies to make
            informed decisions.
          </p>
        </div>
        <Link href='/dashboard/new-scenario'>
          <Button className='bg-primary hover:bg-primary/90'>
            <Plus className='w-4 h-4 mr-2' />
            New Scenario
          </Button>
        </Link>
      </div>

      {scenarios.length === 0 ? (
        <Card className='bg-card border-border'>
          <CardContent className='py-16 text-center'>
            <div className='w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4'>
              <TrendingUp className='w-8 h-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              No scenarios yet
            </h3>
            <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
              Create your first scenario to start comparing job offers and
              investment strategies.
            </p>
            <Link href='/dashboard/new-scenario'>
              <Button className='bg-primary hover:bg-primary/90'>
                <Plus className='w-4 h-4 mr-2' />
                Create First Scenario
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {scenarios.map(scenario => (
            <Card
              key={scenario.id}
              className='bg-card border-border hover:shadow-lg transition-shadow'
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-1'>
                    <CardTitle className='text-lg text-foreground'>
                      {scenario.name}
                    </CardTitle>
                    <CardDescription className='flex items-center space-x-1'>
                      <Calendar className='w-3 h-3' />
                      <span>
                        {new Date(scenario.updatedAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Button variant='ghost' size='sm'>
                    <MoreHorizontal className='w-4 h-4' />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Job Offer Info */}
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <Building className='w-4 h-4 text-muted-foreground' />
                    <span className='font-medium text-foreground'>
                      {scenario.jobOffer.company}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <DollarSign className='w-4 h-4 text-muted-foreground' />
                    <span className='text-foreground'>
                      ${scenario.jobOffer.salary.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <MapPin className='w-4 h-4 text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>
                      {scenario.jobOffer.location}
                    </span>
                  </div>
                </div>

                {/* Investment Summary */}
                <div className='pt-2 border-t border-border'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-foreground'>
                      Investments
                    </span>
                    <Badge variant='secondary'>
                      {scenario.investments.length} ETFs
                    </Badge>
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Monthly: $
                    {scenario.investments
                      .reduce((sum, inv) => sum + inv.monthlyAmount, 0)
                      .toLocaleString()}
                  </div>
                </div>

                {/* Actions */}
                <div className='flex space-x-2 pt-2'>
                  <Link
                    href={`/dashboard/scenarios/${scenario.id}`}
                    className='flex-1'
                  >
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full bg-transparent'
                    >
                      View Details
                    </Button>
                  </Link>
                  <Link
                    href={`/dashboard/scenarios/${scenario.id}/edit`}
                    className='flex-1'
                  >
                    <Button
                      size='sm'
                      className='w-full bg-primary hover:bg-primary/90'
                    >
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
