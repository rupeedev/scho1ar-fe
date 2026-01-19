import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingData {
  organizationData: {
    name: string;
    type: string;
    industry?: string;
    teamSize?: string;
  };
  subscriptionData: {
    planId: string;
    paymentMethod?: string;
  };
  cloudAccountData?: {
    provider: string;
    connectionMethod: string;
    credentials?: any;
  };
  currentStep: number;
  completed: boolean;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateOrganizationData: (data: Partial<OnboardingData['organizationData']>) => void;
  updateSubscriptionData: (data: Partial<OnboardingData['subscriptionData']>) => void;
  updateCloudAccountData: (data: Partial<OnboardingData['cloudAccountData']>) => void;
  setCurrentStep: (step: number) => void;
  markCompleted: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialData: OnboardingData = {
  organizationData: {
    name: '',
    type: 'small-business',
    industry: '',
    teamSize: '1-10',
  },
  subscriptionData: {
    planId: 'trial',
  },
  currentStep: 1,
  completed: false,
};

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateOrganizationData = (newData: Partial<OnboardingData['organizationData']>) => {
    setData(prev => ({
      ...prev,
      organizationData: { ...prev.organizationData, ...newData }
    }));
  };

  const updateSubscriptionData = (newData: Partial<OnboardingData['subscriptionData']>) => {
    setData(prev => ({
      ...prev,
      subscriptionData: { ...prev.subscriptionData, ...newData }
    }));
  };

  const updateCloudAccountData = (newData: Partial<OnboardingData['cloudAccountData']>) => {
    setData(prev => ({
      ...prev,
      cloudAccountData: { ...prev.cloudAccountData, ...newData }
    }));
  };

  const setCurrentStep = (step: number) => {
    setData(prev => ({ ...prev, currentStep: step }));
  };

  const markCompleted = () => {
    setData(prev => ({ ...prev, completed: true }));
  };

  const resetOnboarding = () => {
    setData(initialData);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateOrganizationData,
        updateSubscriptionData,
        updateCloudAccountData,
        setCurrentStep,
        markCompleted,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};