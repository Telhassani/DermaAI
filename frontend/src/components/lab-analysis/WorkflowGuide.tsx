'use client';

import { AIModel } from '@/types/ai-models';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, MessageSquare, Upload, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowGuideProps {
  currentStep: number;
  selectedModel?: AIModel | null;
}

interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function WorkflowGuide({ currentStep, selectedModel }: WorkflowGuideProps) {
  const steps: WorkflowStep[] = [
    {
      number: 1,
      title: 'Select AI Model',
      description: 'Choose the model best suited for your analysis',
      icon: <Brain className="h-4 w-4" />,
    },
    {
      number: 2,
      title: 'Add Clinical Context',
      description: 'Provide guidance and clinical focus areas',
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      number: 3,
      title: 'Upload Lab Results',
      description: 'Drop PDF or image file for analysis',
      icon: <Upload className="h-4 w-4" />,
    },
    {
      number: 4,
      title: 'Review Analysis',
      description: 'Get AI-powered clinical interpretation',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Workflow Card */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Analysis Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isCompleted = currentStep > step.number;
              const isActive = currentStep === step.number;

              return (
                <div
                  key={step.number}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg transition-colors',
                    isActive && 'bg-violet-50',
                    isCompleted && 'opacity-60'
                  )}
                >
                  {/* Step Number Circle */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 font-semibold',
                      isCompleted
                        ? 'bg-green-100 text-green-700'
                        : isActive
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isActive ? 'text-violet-700' : 'text-gray-700'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
                  </div>

                  {/* Active Pulse */}
                  {isActive && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-violet-600 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Model Routing Info */}
      {selectedModel && !selectedModel.has_vision && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            <strong>Smart Routing:</strong> {selectedModel.name} doesn't support image analysis.
            Claude will automatically extract lab values first, then {selectedModel.name} will
            analyze the data for clinical interpretation.
          </AlertDescription>
        </Alert>
      )}

      {/* Selection Status */}
      {selectedModel && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="pt-4 text-sm">
            <p className="text-xs text-gray-600 mb-1">Selected Model:</p>
            <p className="font-semibold text-gray-900">{selectedModel.name}</p>
            <p className="text-xs text-gray-600 mt-1">
              {selectedModel.provider} • {selectedModel.has_vision ? 'Vision-enabled' : 'Text-based'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* How It Works Info */}
      <Card className="bg-gradient-to-br from-violet-50 to-blue-50 border-0">
        <CardHeader>
          <CardTitle className="text-sm">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-700 space-y-2">
          <p>
            <strong className="text-violet-700">Intelligent Analysis:</strong> The system
            automatically uses the best approach based on your selected model's capabilities.
          </p>
          <p>
            <strong className="text-violet-700">Two-Stage Process:</strong> If your model
            doesn't support vision, Claude extracts the data first, then your model analyzes it.
          </p>
          <p>
            <strong className="text-violet-700">Secure Keys:</strong> API keys are encrypted
            and stored only for your session (1 hour).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
