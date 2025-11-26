'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Lightbulb, Info } from 'lucide-react';

interface UserPromptZoneProps {
  onPromptChange: (prompt: string) => void;
  onContinue?: () => void;
}

const PROMPT_EXAMPLES = [
  'Focus on kidney function markers and assess for chronic kidney disease risk.',
  'Compare with age-adjusted normal ranges for a 45-year-old patient.',
  'Identify any values suggesting diabetes complications or metabolic syndrome.',
  'Assess liver function and potential medication interactions with current prescriptions.',
  'Look for inflammation markers and autoimmune indicators in these results.',
  'Analyze thyroid function and metabolic rate implications.',
  'Check for electrolyte imbalances that could explain current symptoms.',
];

export function UserPromptZone({ onPromptChange, onContinue }: UserPromptZoneProps) {
  const [prompt, setPrompt] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    onPromptChange(value);
  };

  const handleExampleClick = (example: string) => {
    handlePromptChange(example);
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Clinical Context & Instructions
            </CardTitle>
            <CardDescription className="mt-1">
              Guide the AI analysis with specific questions or clinical focus areas
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Step 2
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Textarea */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Your Guidance (Optional)</label>
          <Textarea
            placeholder="Example: Please focus on thyroid function and identify any abnormalities that might explain patient fatigue and weight changes..."
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            rows={4}
            className="resize-none border-gray-300"
          />
          <p className="text-xs text-gray-600">
            {prompt.length} characters · The more specific you are, the better the analysis
          </p>
        </div>

        {/* Examples Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExamples(!showExamples)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          {showExamples ? 'Hide' : 'Show'} Example Prompts
        </Button>

        {/* Example Prompts */}
        {showExamples && (
          <div className="space-y-2 pt-2 border-t border-blue-200">
            <p className="text-xs font-medium text-gray-600">Click to use:</p>
            <div className="grid grid-cols-1 gap-2">
              {PROMPT_EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example)}
                  className="block w-full text-left text-sm p-2 rounded bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guidance Tips */}
        <Alert className="border-blue-200 bg-white">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-gray-700">
            <strong>Tips for effective prompts:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
              <li>Mention specific organs or systems to focus on</li>
              <li>Include patient symptoms or clinical presentation</li>
              <li>Request comparisons with specific age/population groups</li>
              <li>Ask about medication interaction potential</li>
              <li>Specify any clinical concerns you want addressed</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Continue Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={onContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue to Upload →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
