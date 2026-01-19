import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Building, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import { useToast } from '@/components/ui/use-toast';
import { organizationsApi } from '@/lib/api/organizations';

const OrganizationSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'small-business',
    industry: '',
    teamSize: '1-10',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const organizationTypes = [
    { value: 'startup', label: 'Startup', icon: <Building className="h-4 w-4" /> },
    { value: 'small-business', label: 'Small Business', icon: <Briefcase className="h-4 w-4" /> },
    { value: 'enterprise', label: 'Enterprise', icon: <Users className="h-4 w-4" /> },
    { value: 'individual', label: 'Individual', icon: <Users className="h-4 w-4" /> }
  ];

  const teamSizes = [
    '1-10',
    '11-50', 
    '51-200',
    '201-1000',
    '1000+'
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'E-commerce',
    'Education',
    'Manufacturing',
    'Media',
    'Government',
    'Other'
  ];

  // Fetch existing organization data on component mount
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setIsLoading(true);
        const organizations = await organizationsApi.getAll();
        
        if (organizations && organizations.length > 0) {
          const existingOrg = organizations[0];
          setIsEditing(true);
          
          // Pre-populate form with existing data
          setFormData({
            name: existingOrg.name || '',
            type: 'small-business', // Default since we don't store type yet
            industry: '', // Default since we don't store industry yet
            teamSize: '1-10', // Default since we don't store team size yet
          });
          
          setTermsAccepted(true); // User already accepted terms when creating
        }
      } catch (error) {
        console.log('No existing organization found or error fetching:', error);
        // This is fine - user is creating a new organization
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }
    
    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms of service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        // Update existing organization
        const organizations = await organizationsApi.getAll();
        if (organizations && organizations.length > 0) {
          const orgId = organizations[0].id;
          const updateData = {
            name: formData.name,
          };
          
          await organizationsApi.update(orgId, updateData);
          
          toast({
            title: 'Organization updated!',
            description: 'Your organization has been updated successfully.',
          });
        }
      } else {
        // Create new organization
        const organizationData = {
          name: formData.name,
          subscription_plan: 'trial' // Default to trial
        };
        
        await organizationsApi.create(organizationData);
        
        toast({
          title: 'Organization created!',
          description: 'Your organization has been set up successfully.',
        });
      }
      
      // User is already authenticated and has subscription, go to Cloud Accounts
      navigate('/onboarding');
      
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/cloud-accounts');
  };

  const handleSkip = () => {
    navigate('/cloud-accounts');
  };

  if (isLoading) {
    return (
      <OnboardingLayout
        currentStep={1}
        totalSteps={1}
        title="Loading..."
        description="Loading organization details..."
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={1}
      title={isEditing ? "Edit Your Organization" : "Set Up Your Organization"}
      description={isEditing ? "Update your organization details." : "Tell us about your organization to customize your Scho1ar Solution experience."}
    >
      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name *</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="Enter your organization name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Organization Type */}
            <div className="space-y-2">
              <Label>Organization Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {organizationTypes.map((type) => (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.type === type.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleInputChange('type', type.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${
                          formData.type === type.value 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {type.icon}
                        </div>
                        <span className="font-medium">{type.label}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Team Size */}
            <div className="space-y-2">
              <Label>Team Size</Label>
              <Select value={formData.teamSize} onValueChange={(value) => handleInputChange('teamSize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  {teamSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label>Industry (Optional)</Label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Terms of Service */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => {
                    setTermsAccepted(checked as boolean);
                    if (errors.terms) {
                      setErrors(prev => ({ ...prev, terms: '' }));
                    }
                  }}
                  className={errors.terms ? 'border-red-500' : ''}
                />
                <div className="space-y-1">
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </Label>
                  {errors.terms && (
                    <p className="text-sm text-red-500">{errors.terms}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                >
                  Skip Setup
                </Button>
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>{isEditing ? 'Updating Organization...' : 'Creating Organization...'}</>
                ) : (
                  <>
                    {isEditing ? 'Update Organization' : 'Continue'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
};

export default OrganizationSetup;