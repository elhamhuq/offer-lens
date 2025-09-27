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
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Upload,
  TrendingUp,
  Plus,
  MoreHorizontal,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  FolderOpen,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useScenario } from '@/hooks/useScenario';
import { useStore } from '@/store/useStore';
import FileUpload from '@/components/FileUpload';
import InvestmentForm from '@/components/InvestmentForm';
import type { JobOffer, Investment } from '@/types';

export default function ScenariosPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState('scenarios');

  // New scenario state
  const [scenarioName, setScenarioName] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [jobOffer, setJobOffer] = useState<Partial<JobOffer>>({});
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isManualEntry, setIsManualEntry] = useState(false);

  const { createScenario, deleteScenario } = useScenario();
  const { scenarios } = useStore();
  const router = useRouter();

  const handleFileProcessed = (data: any) => {
    setJobOffer({
      id: Date.now().toString(),
      title: data.title,
      company: data.company,
      salary: data.salary,
      location: data.location,
      benefits: data.benefits,
      uploadedAt: new Date(),
    });
    setCurrentStep(2);
  };

  const handleManualJobEntry = () => {
    if (
      jobOffer.title &&
      jobOffer.company &&
      jobOffer.salary &&
      jobOffer.location
    ) {
      setCurrentStep(2);
    }
  };

  const handleInvestmentsChange = (newInvestments: Investment[]) => {
    setInvestments(newInvestments);
  };

  const handleSaveScenario = () => {
    if (scenarioName && jobOffer.title && investments.length > 0) {
      const newScenario = createScenario(
        scenarioName,
        jobOffer as JobOffer,
        investments
      );
      // Reset form and switch to scenarios tab
      setScenarioName('');
      setCurrentStep(1);
      setJobOffer({});
      setInvestments([]);
      setIsManualEntry(false);
      setActiveTab('scenarios');
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Job Offer',
      description: 'Upload or enter job details',
    },
    {
      number: 2,
      title: 'Investments',
      description: 'Plan your investment strategy',
    },
    { number: 3, title: 'Review', description: 'Name and save your scenario' },
  ];

  const tabs = [
    { id: 'scenarios', label: 'Scenarios', icon: FolderOpen },
    { id: 'create', label: 'Create New', icon: Plus },
  ];

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Page Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>Scenarios</h1>
        <p className='text-muted-foreground'>
          Manage your scenarios and create new ones to compare job offers and
          investment strategies.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className='mb-8'>
        <div className='flex space-x-1 bg-muted/50 p-1 rounded-lg w-fit'>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className='w-4 h-4' />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'scenarios' && (
        <div>
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
                <Button
                  onClick={() => setActiveTab('create')}
                  className='bg-primary hover:bg-primary/90'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  Create First Scenario
                </Button>
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
      )}

      {activeTab === 'create' && (
        <div>
          {/* Save Button */}
          <div className='flex justify-end mb-8'>
            <Button
              onClick={handleSaveScenario}
              disabled={
                !scenarioName || !jobOffer.title || investments.length === 0
              }
              className='bg-primary hover:bg-primary/90'
            >
              <Save className='w-4 h-4 mr-2' />
              Save Scenario
            </Button>
          </div>

          {/* Progress Steps */}
          <div className='mb-8'>
            <div className='flex items-center justify-between max-w-2xl mx-auto'>
              {steps.map((step, index) => (
                <div key={step.number} className='flex items-center'>
                  <div className='flex flex-col items-center'>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep >= step.number
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.number}
                    </div>
                    <div className='mt-2 text-center'>
                      <p className='text-sm font-medium text-foreground'>
                        {step.title}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-4 ${
                        currentStep > step.number ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className='max-w-4xl mx-auto'>
            {/* Step 1: Job Offer */}
            {currentStep === 1 && (
              <div className='space-y-6'>
                <div className='flex justify-center space-x-4 mb-6'>
                  <Button
                    variant={!isManualEntry ? 'default' : 'outline'}
                    onClick={() => setIsManualEntry(false)}
                    className={
                      !isManualEntry
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-transparent'
                    }
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    Upload Document
                  </Button>
                  <Button
                    variant={isManualEntry ? 'default' : 'outline'}
                    onClick={() => setIsManualEntry(true)}
                    className={
                      isManualEntry
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-transparent'
                    }
                  >
                    Manual Entry
                  </Button>
                </div>

                {!isManualEntry ? (
                  <FileUpload
                    onFileProcessed={handleFileProcessed}
                    maxFiles={1}
                  />
                ) : (
                  <Card className='bg-card border-border'>
                    <CardHeader>
                      <CardTitle>Enter Job Details</CardTitle>
                      <CardDescription>
                        Manually enter your job offer information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='company'>Company</Label>
                          <Input
                            id='company'
                            value={jobOffer.company || ''}
                            onChange={e =>
                              setJobOffer({
                                ...jobOffer,
                                company: e.target.value,
                              })
                            }
                            placeholder='TechCorp Inc.'
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='title'>Job Title</Label>
                          <Input
                            id='title'
                            value={jobOffer.title || ''}
                            onChange={e =>
                              setJobOffer({
                                ...jobOffer,
                                title: e.target.value,
                              })
                            }
                            placeholder='Senior Software Engineer'
                          />
                        </div>
                      </div>

                      <div className='grid md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='salary'>Annual Salary</Label>
                          <Input
                            id='salary'
                            type='number'
                            value={jobOffer.salary || ''}
                            onChange={e =>
                              setJobOffer({
                                ...jobOffer,
                                salary: Number(e.target.value),
                              })
                            }
                            placeholder='150000'
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='location'>Location</Label>
                          <Input
                            id='location'
                            value={jobOffer.location || ''}
                            onChange={e =>
                              setJobOffer({
                                ...jobOffer,
                                location: e.target.value,
                              })
                            }
                            placeholder='San Francisco, CA'
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleManualJobEntry}
                        disabled={
                          !jobOffer.title ||
                          !jobOffer.company ||
                          !jobOffer.salary ||
                          !jobOffer.location
                        }
                        className='w-full bg-primary hover:bg-primary/90'
                      >
                        Continue to Investments
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 2: Investments */}
            {currentStep === 2 && (
              <div className='space-y-6'>
                <Card className='bg-accent/5 border-accent/20'>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-foreground'>
                          {jobOffer.company}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {jobOffer.title} • $
                          {jobOffer.salary?.toLocaleString()} •{' '}
                          {jobOffer.location}
                        </p>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setCurrentStep(1)}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <InvestmentForm
                  onInvestmentsChange={handleInvestmentsChange}
                  monthlyBudget={
                    Math.floor(((jobOffer.salary || 0) * 0.72) / 12) - 4000
                  } // Rough take-home minus expenses
                />

                <div className='flex justify-center'>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={investments.length === 0}
                    className='bg-primary hover:bg-primary/90'
                  >
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className='space-y-6'>
                <Card className='bg-card border-border'>
                  <CardHeader>
                    <CardTitle>Name Your Scenario</CardTitle>
                    <CardDescription>
                      Give your scenario a memorable name for easy comparison
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <Label htmlFor='scenarioName'>Scenario Name</Label>
                      <Input
                        id='scenarioName'
                        value={scenarioName}
                        onChange={e => setScenarioName(e.target.value)}
                        placeholder={`${jobOffer.company} ${
                          jobOffer.location?.split(',')[1]?.trim() || ''
                        }`}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <div className='grid md:grid-cols-2 gap-6'>
                  <Card className='bg-card border-border'>
                    <CardHeader>
                      <CardTitle className='text-lg'>
                        Job Offer Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Company</span>
                        <span className='font-medium text-foreground'>
                          {jobOffer.company}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Position</span>
                        <span className='font-medium text-foreground'>
                          {jobOffer.title}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Salary</span>
                        <span className='font-medium text-foreground'>
                          ${jobOffer.salary?.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Location</span>
                        <span className='font-medium text-foreground'>
                          {jobOffer.location}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='bg-card border-border'>
                    <CardHeader>
                      <CardTitle className='text-lg'>
                        Investment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Monthly Investment
                        </span>
                        <span className='font-medium text-foreground'>
                          $
                          {investments
                            .reduce((sum, inv) => sum + inv.monthlyAmount, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Number of ETFs
                        </span>
                        <span className='font-medium text-foreground'>
                          {investments.length}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Annual Investment
                        </span>
                        <span className='font-medium text-foreground'>
                          $
                          {(
                            investments.reduce(
                              (sum, inv) => sum + inv.monthlyAmount,
                              0
                            ) * 12
                          ).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
