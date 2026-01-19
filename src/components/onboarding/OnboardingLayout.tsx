import React from 'react';
import { DollarSign } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  description?: string;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  title,
  description
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Scho1ar</span>
              </div>
              
              <div className="text-sm text-gray-500">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="flex items-center">
                <div className="flex-1 flex items-center">
                  {Array.from({ length: totalSteps }, (_, index) => (
                    <React.Fragment key={index}>
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                          index + 1 <= currentStep
                            ? 'bg-blue-600 text-white'
                            : index + 1 === currentStep + 1
                            ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < totalSteps - 1 && (
                        <div
                          className={`flex-1 h-1 mx-4 ${
                            index + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
              {description && (
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
              )}
            </div>
            
            <div className="max-w-2xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;