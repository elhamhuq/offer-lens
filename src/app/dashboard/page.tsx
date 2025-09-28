'use client';

import { useState, useEffect } from 'react';
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
  Save,
  TrendingUp,
  Plus,
  MoreHorizontal,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  FolderOpen,
  Sparkles,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScenario } from '@/hooks/useScenario';
import { useStore } from '@/store/useStore';
import FileUploadRAG from '@/components/FileUploadRAG';
import InvestmentForm from '@/components/InvestmentForm';
import { SimpleDropdown, DropdownItem } from '@/components/ui/simple-dropdown';
import type { JobOffer, Investment } from '@/types';

export default function DashboardPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState('scenarios');

  // New scenario state
  const [scenarioName, setScenarioName] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [jobOffer, setJobOffer] = useState<Partial<JobOffer>>({});
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState(4000);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit scenario state
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [editScenarioName, setEditScenarioName] = useState('');
  const [editJobOffer, setEditJobOffer] = useState<Partial<JobOffer>>({});
  const [editInvestments, setEditInvestments] = useState<Investment[]>([]);

  const { createScenario, deleteScenario, updateCurrentScenario } =
    useScenario();
  const { scenarios, addScenario, currentScenario, setCurrentScenario } =
    useStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle edit parameter from URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && scenarios.length > 0) {
      const scenarioToEdit = scenarios.find(s => s.id === editId);
      if (scenarioToEdit && !editingScenario) {
        handleEditScenario(scenarioToEdit);
      }
    }
  }, [searchParams, scenarios]);

  const handleManualJobEntry = () => {
    const currentJobOffer = editingScenario ? editJobOffer : jobOffer;
    if (
      currentJobOffer.title &&
      currentJobOffer.company &&
      currentJobOffer.salary &&
      currentJobOffer.location
    ) {
      setCurrentStep(2);
    }
  };

  const handleInvestmentsChange = (newInvestments: Investment[]) => {
    if (editingScenario) {
      setEditInvestments(newInvestments);
    } else {
      setInvestments(newInvestments);
    }
  };

  const handleSaveScenario = async () => {
    if (scenarioName && jobOffer.title && investments.length > 0) {
      setIsSaving(true);
      setSaveError(null);

      try {
        const newScenario = await createScenario(
          scenarioName,
          jobOffer as JobOffer,
          investments
        );

        if (newScenario) {
          // Show success message
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);

          // Reset form and switch to scenarios tab
          setScenarioName('');
          setCurrentStep(1);
          setJobOffer({});
          setInvestments([]);
          setActiveTab('scenarios');
        } else {
          setSaveError('Failed to create scenario. Please try again.');
        }
      } catch (error) {
        console.error('Error creating scenario:', error);
        setSaveError(
          'An error occurred while saving the scenario. Please try again.'
        );
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Edit scenario functions
  const handleEditScenario = (scenario: any) => {
    setEditingScenario(scenario.id);
    setEditScenarioName(scenario.name);
    setEditJobOffer(scenario.jobOffer);
    setEditInvestments(scenario.investments);
    setActiveTab('create');
    setCurrentStep(1);
  };

  const handleSaveEdit = async () => {
    if (
      !editingScenario ||
      !editScenarioName ||
      !editJobOffer.title ||
      editInvestments.length === 0
    ) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Set the current scenario to the one being edited
      const scenarioToEdit = scenarios.find(s => s.id === editingScenario);
      if (scenarioToEdit) {
        setCurrentScenario(scenarioToEdit);

        // Update the scenario
        await updateCurrentScenario({
          name: editScenarioName,
          jobOffer: editJobOffer as JobOffer,
          investments: editInvestments,
        });

        // Show success message
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);

        // Reset edit state and switch to scenarios tab
        setEditingScenario(null);
        setEditScenarioName('');
        setEditJobOffer({});
        setEditInvestments([]);
        setActiveTab('scenarios');
      }
    } catch (error) {
      console.error('Error updating scenario:', error);
      setSaveError(
        'An error occurred while updating the scenario. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewDetails = (scenario: any) => {
    // Navigate to a detailed view or show a modal
    router.push(`/dashboard/scenario/${scenario.id}`);
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this scenario? This action cannot be undone.'
      )
    ) {
      const success = await deleteScenario(scenarioId);
      if (!success) {
        setSaveError('Failed to delete scenario. Please try again.');
      }
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
    { id: 'ai-analysis', label: 'AI Document Analysis', icon: Sparkles },
  ];

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Page Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>Dashboard</h1>
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
                      <SimpleDropdown
                        trigger={
                          <Button variant='ghost' size='sm'>
                            <MoreHorizontal className='w-4 h-4' />
                          </Button>
                        }
                        align='right'
                      >
                        <DropdownItem
                          onClick={() => handleViewDetails(scenario)}
                        >
                          <Eye className='w-4 h-4 mr-2' />
                          <span>View Details</span>
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => handleDeleteScenario(scenario.id)}
                        >
                          <Trash2 className='w-4 h-4 mr-2' />
                          <span>Delete</span>
                        </DropdownItem>
                      </SimpleDropdown>
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
                          .reduce(
                            (sum: number, inv: Investment) =>
                              sum + inv.monthlyAmount,
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex space-x-2 pt-2'>
                      <Button
                        size='sm'
                        className='flex-1 bg-primary hover:bg-primary/90'
                        onClick={() => handleEditScenario(scenario)}
                      >
                        <Edit className='w-4 h-4 mr-2' />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content for AI Analysis */}
      {activeTab === 'ai-analysis' && (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold'>
                AI-Powered Document Analysis
              </h2>
              <p className='text-muted-foreground'>
                Upload job offers for instant AI analysis with Google Gemini
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/analysis/new')}
              className='gap-2'
            >
              <Sparkles className='h-4 w-4' />
              New Analysis
            </Button>
          </div>

          <FileUploadRAG
            onAnalysisComplete={(analysisId, data) => {
              router.push(`/dashboard/analysis/${analysisId}`);
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>
                View your recent job offer analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => router.push('/dashboard/analysis/history')}
              >
                View Analysis History →
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content for Create New Scenario */}
      {activeTab === 'create' && (
        <div>
          {/* Save Button */}
          <div className='flex justify-end mb-8'>
            <div className='flex flex-col items-end space-y-2'>
              {saveError && (
                <div className='text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md'>
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className='text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md'>
                  {editingScenario
                    ? 'Scenario updated successfully!'
                    : 'Scenario saved successfully!'}
                </div>
              )}
              <Button
                onClick={editingScenario ? handleSaveEdit : handleSaveScenario}
                disabled={
                  editingScenario
                    ? !editScenarioName ||
                      !editJobOffer.title ||
                      editInvestments.length === 0 ||
                      isSaving
                    : !scenarioName ||
                      !jobOffer.title ||
                      investments.length === 0 ||
                      isSaving
                }
                className='bg-primary hover:bg-primary/90'
              >
                <Save className='w-4 h-4 mr-2' />
                {isSaving
                  ? 'Saving...'
                  : editingScenario
                    ? 'Update Scenario'
                    : 'Save Scenario'}
              </Button>
            </div>
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
                          value={
                            editingScenario
                              ? editJobOffer.company || ''
                              : jobOffer.company || ''
                          }
                          onChange={e => {
                            if (editingScenario) {
                              setEditJobOffer({
                                ...editJobOffer,
                                company: e.target.value,
                              });
                            } else {
                              setJobOffer({
                                ...jobOffer,
                                company: e.target.value,
                              });
                            }
                          }}
                          placeholder='TechCorp Inc.'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='title'>Job Title</Label>
                        <Input
                          id='title'
                          value={
                            editingScenario
                              ? editJobOffer.title || ''
                              : jobOffer.title || ''
                          }
                          onChange={e => {
                            if (editingScenario) {
                              setEditJobOffer({
                                ...editJobOffer,
                                title: e.target.value,
                              });
                            } else {
                              setJobOffer({
                                ...jobOffer,
                                title: e.target.value,
                              });
                            }
                          }}
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
                          value={
                            editingScenario
                              ? editJobOffer.salary || ''
                              : jobOffer.salary || ''
                          }
                          onChange={e => {
                            if (editingScenario) {
                              setEditJobOffer({
                                ...editJobOffer,
                                salary: Number(e.target.value),
                              });
                            } else {
                              setJobOffer({
                                ...jobOffer,
                                salary: Number(e.target.value),
                              });
                            }
                          }}
                          placeholder='150000'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='location'>Location</Label>
                        <Input
                          id='location'
                          value={
                            editingScenario
                              ? editJobOffer.location || ''
                              : jobOffer.location || ''
                          }
                          onChange={e => {
                            if (editingScenario) {
                              setEditJobOffer({
                                ...editJobOffer,
                                location: e.target.value,
                              });
                            } else {
                              setJobOffer({
                                ...jobOffer,
                                location: e.target.value,
                              });
                            }
                          }}
                          placeholder='San Francisco, CA'
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleManualJobEntry}
                      disabled={
                        editingScenario
                          ? !editJobOffer.title ||
                            !editJobOffer.company ||
                            !editJobOffer.salary ||
                            !editJobOffer.location
                          : !jobOffer.title ||
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
                          {editingScenario
                            ? editJobOffer.company
                            : jobOffer.company}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {editingScenario
                            ? editJobOffer.title
                            : jobOffer.title}{' '}
                          • $
                          {(editingScenario
                            ? editJobOffer.salary
                            : jobOffer.salary
                          )?.toLocaleString()}{' '}
                          •{' '}
                          {editingScenario
                            ? editJobOffer.location
                            : jobOffer.location}
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

                <Card className='bg-card border-border'>
                  <CardHeader>
                    <CardTitle>Estimate Monthly Expenses</CardTitle>
                    <CardDescription>
                      Provide an estimate of your monthly expenses to calculate
                      your investment budget.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <Label htmlFor='monthlyExpenses'>
                        Monthly Expenses ($)
                      </Label>
                      <Input
                        id='monthlyExpenses'
                        type='number'
                        value={monthlyExpenses}
                        onChange={e =>
                          setMonthlyExpenses(Number(e.target.value))
                        }
                        placeholder='e.g., 4000'
                      />
                    </div>
                  </CardContent>
                </Card>

                <InvestmentForm
                  onInvestmentsChange={handleInvestmentsChange}
                  monthlyBudget={
                    Math.floor(
                      (((editingScenario
                        ? editJobOffer.salary
                        : jobOffer.salary) || 0) *
                        0.7) /
                        12
                    ) - monthlyExpenses
                  } // Using 70% take-home pay estimate
                />

                <div className='flex justify-center'>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={
                      (editingScenario
                        ? editInvestments.length
                        : investments.length) === 0
                    }
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
                        value={
                          editingScenario ? editScenarioName : scenarioName
                        }
                        onChange={e => {
                          if (editingScenario) {
                            setEditScenarioName(e.target.value);
                          } else {
                            setScenarioName(e.target.value);
                          }
                        }}
                        placeholder={`${editingScenario ? editJobOffer.company : jobOffer.company} ${
                          (editingScenario
                            ? editJobOffer.location
                            : jobOffer.location
                          )
                            ?.split(',')[1]
                            ?.trim() || ''
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
                          {editingScenario
                            ? editJobOffer.company
                            : jobOffer.company}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Position</span>
                        <span className='font-medium text-foreground'>
                          {editingScenario
                            ? editJobOffer.title
                            : jobOffer.title}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Salary</span>
                        <span className='font-medium text-foreground'>
                          $
                          {(editingScenario
                            ? editJobOffer.salary
                            : jobOffer.salary
                          )?.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Location</span>
                        <span className='font-medium text-foreground'>
                          {editingScenario
                            ? editJobOffer.location
                            : jobOffer.location}
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
                          {(editingScenario ? editInvestments : investments)
                            .reduce(
                              (sum: number, inv: Investment) =>
                                sum + inv.monthlyAmount,
                              0
                            )
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Number of ETFs
                        </span>
                        <span className='font-medium text-foreground'>
                          {editingScenario
                            ? editInvestments.length
                            : investments.length}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Annual Investment
                        </span>
                        <span className='font-medium text-foreground'>
                          $
                          {(
                            (editingScenario
                              ? editInvestments
                              : investments
                            ).reduce(
                              (sum: number, inv: Investment) =>
                                sum + inv.monthlyAmount,
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
