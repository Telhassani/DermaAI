import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AIAnalysisResponse, Severity } from '@/lib/api/ai-analysis'
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIAnalysisResultCardProps {
    analysis: AIAnalysisResponse
    className?: string
}

export function AIAnalysisResultCard({ analysis, className }: AIAnalysisResultCardProps) {
    const getSeverityColor = (severity?: Severity) => {
        switch (severity) {
            case Severity.BENIGN:
                return 'bg-green-100 text-green-800 border-green-200'
            case Severity.MILD:
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case Severity.MODERATE:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case Severity.SEVERE:
                return 'bg-orange-100 text-orange-800 border-orange-200'
            case Severity.CRITICAL:
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getConfidenceColor = (score?: number) => {
        if (!score) return 'text-gray-500'
        if (score >= 0.9) return 'text-green-600'
        if (score >= 0.7) return 'text-yellow-600'
        return 'text-red-600'
    }

    return (
        <Card className={cn("w-full border-l-4", className, {
            "border-l-green-500": analysis.severity === Severity.BENIGN,
            "border-l-blue-500": analysis.severity === Severity.MILD,
            "border-l-yellow-500": analysis.severity === Severity.MODERATE,
            "border-l-orange-500": analysis.severity === Severity.SEVERE,
            "border-l-red-500": analysis.severity === Severity.CRITICAL,
        })}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            {analysis.primary_diagnosis || "Analyse terminée"}
                            {analysis.severity && (
                                <Badge variant="outline" className={getSeverityColor(analysis.severity)}>
                                    {analysis.severity}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Modèle: {analysis.ai_model} • Confiance:
                            <span className={cn("font-bold ml-1", getConfidenceColor(analysis.confidence_score))}>
                                {analysis.confidence_score ? `${(analysis.confidence_score * 100).toFixed(1)}%` : 'N/A'}
                            </span>
                        </CardDescription>
                    </div>
                    <div className="text-xs text-gray-500">
                        {new Date(analysis.created_at).toLocaleDateString()}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Clinical Findings */}
                {analysis.clinical_findings && analysis.clinical_findings.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <EyeIcon className="w-4 h-4" /> Observations cliniques
                        </h4>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-1">
                            {analysis.clinical_findings.map((finding, idx) => (
                                <li key={idx}>{finding}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Differential Diagnoses */}
                {analysis.differential_diagnoses && analysis.differential_diagnoses.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <ListIcon className="w-4 h-4" /> Diagnostics différentiels
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {analysis.differential_diagnoses.map((diag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                    {diag.condition} ({diag.probability})
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
                            <Info className="w-4 h-4" /> Recommandations
                        </h4>
                        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                            {analysis.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Reasoning */}
                {analysis.reasoning && (
                    <div className="text-sm text-gray-600 italic border-t pt-3 mt-2">
                        "{analysis.reasoning}"
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-gray-50 py-3 text-xs text-gray-500 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-yellow-600" />
                <span>Analyse générée par IA. Doit être validée par un médecin.</span>
            </CardFooter>
        </Card>
    )
}

function EyeIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function ListIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
    )
}
