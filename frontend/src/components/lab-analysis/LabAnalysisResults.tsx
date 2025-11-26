'use client';

import { LabValue, LabResultUploadResponse } from '@/types/lab-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';

interface LabAnalysisResultsProps {
  result: LabResultUploadResponse;
}

export function LabAnalysisResults({ result }: LabAnalysisResultsProps) {
  const formatValue = (value: number, unit: string) => {
    return `${value.toFixed(2)} ${unit}`;
  };

  const getStatusBadge = (isAbnormal: boolean) => {
    return isAbnormal ? (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="w-3 h-3" />
        Abnormal
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Normal
      </Badge>
    );
  };

  const getValueStatus = (value: number, refMin?: number | null, refMax?: number | null) => {
    if (refMin === null && refMax === null) return null;

    const min = refMin ?? -Infinity;
    const max = refMax ?? Infinity;

    if (value < min) {
      return { status: 'low', icon: TrendingDown, color: 'text-red-600' };
    }
    if (value > max) {
      return { status: 'high', icon: TrendingUp, color: 'text-red-600' };
    }
    return { status: 'normal', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      {/* Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <Badge variant={result.status === 'PENDING' ? 'secondary' : 'default'}>
              {result.status}
            </Badge>
          </div>
          {result.confidence_score && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Confidence Score</span>
              <span className="text-sm font-semibold">
                {(result.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
          )}
          {result.created_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Analyzed</span>
              <span className="text-sm text-gray-500">
                {new Date(result.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Lab Values */}
      {result.lab_values_extracted && result.lab_values_extracted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lab Values</CardTitle>
            <CardDescription>
              {result.lab_values_extracted.length} test results extracted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.lab_values_extracted.map((labValue, idx) => {
                const valueStatus = getValueStatus(
                  labValue.value,
                  labValue.reference_min,
                  labValue.reference_max
                );

                return (
                  <div
                    key={idx}
                    className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <p className="font-medium text-gray-900">{labValue.test_name}</p>
                        <p className="text-sm text-gray-600">
                          {formatValue(labValue.value, labValue.unit)}
                        </p>
                        {labValue.reference_min !== null || labValue.reference_max !== null ? (
                          <p className="text-xs text-gray-500">
                            Reference:{' '}
                            {labValue.reference_min !== null
                              ? labValue.reference_min.toFixed(2)
                              : '—'}{' '}
                            to{' '}
                            {labValue.reference_max !== null
                              ? labValue.reference_max.toFixed(2)
                              : '—'}{' '}
                            {labValue.unit}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        {getStatusBadge(labValue.is_abnormal)}
                        {valueStatus && (
                          <p className={`text-xs font-medium mt-1 ${valueStatus.color}`}>
                            {valueStatus.status === 'low' ? 'Below Range' : 'Above Range'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinical Findings */}
      {result.clinical_findings && result.clinical_findings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clinical Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.clinical_findings.map((finding, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 text-sm text-gray-700"
                >
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 text-sm text-gray-700"
                >
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Reasoning */}
      {result.reasoning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Reasoning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">{result.reasoning}</p>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {result.error_message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{result.error_message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
