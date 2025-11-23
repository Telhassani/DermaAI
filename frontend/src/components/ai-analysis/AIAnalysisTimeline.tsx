'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AIAnalysisResponse, Severity } from '@/lib/api/ai-analysis'
import { format } from 'date-fns'
import { TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIAnalysisTimelineProps {
    patientId: number
    className?: string
}

interface TimelineEntry {
    analysis: AIAnalysisResponse
    index: number
    trend: 'improved' | 'regressed' | 'stable'
}

export function AIAnalysisTimeline({ patientId, className }: AIAnalysisTimelineProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null)

    // Fetch all analyses for patient
    const { data: analyses, isLoading, error } = useQuery({
        queryKey: ['patientAnalysesTimeline', patientId],
        queryFn: async () => {
            const response = await fetch(
                `/api/v1/ai-analysis/patient/${patientId}?skip=0&limit=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                }
            )
            if (!response.ok) throw new Error('Failed to fetch analyses')
            const data = await response.json()
            return data.items as AIAnalysisResponse[]
        },
        enabled: !!patientId
    })

    // Calculate trend between consecutive analyses
    const timelineEntries: TimelineEntry[] = React.useMemo(() => {
        if (!analyses || analyses.length < 2) return []

        return analyses.map((analysis, index) => {
            let trend: 'improved' | 'regressed' | 'stable' = 'stable'

            if (index < analyses.length - 1) {
                const current = analysis
                const previous = analyses[index + 1]

                // Compare severity levels
                const severityOrder = { BENIGN: 0, MILD: 1, MODERATE: 2, SEVERE: 3, CRITICAL: 4 }
                const currentSeverity = severityOrder[current.severity as keyof typeof severityOrder] ?? 2
                const previousSeverity = severityOrder[previous.severity as keyof typeof severityOrder] ?? 2

                if (currentSeverity < previousSeverity) {
                    trend = 'improved'
                } else if (currentSeverity > previousSeverity) {
                    trend = 'regressed'
                }
            }

            return {
                analysis,
                index,
                trend
            }
        })
    }, [analyses])

    const getSeverityColor = (severity?: Severity) => {
        switch (severity) {
            case Severity.BENIGN: return 'bg-green-100 text-green-800'
            case Severity.MILD: return 'bg-blue-100 text-blue-800'
            case Severity.MODERATE: return 'bg-yellow-100 text-yellow-800'
            case Severity.SEVERE: return 'bg-orange-100 text-orange-800'
            case Severity.CRITICAL: return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTrendIcon = (trend: 'improved' | 'regressed' | 'stable') => {
        switch (trend) {
            case 'improved':
                return <TrendingDown className="h-4 w-4 text-green-600" />
            case 'regressed':
                return <TrendingUp className="h-4 w-4 text-red-600" />
            default:
                return <Minus className="h-4 w-4 text-gray-600" />
        }
    }

    const getTrendLabel = (trend: 'improved' | 'regressed' | 'stable') => {
        switch (trend) {
            case 'improved': return 'Improvement'
            case 'regressed': return 'Regression'
            default: return 'Stable'
        }
    }

    const getTrendColor = (trend: 'improved' | 'regressed' | 'stable') => {
        switch (trend) {
            case 'improved': return 'bg-green-50 border-green-200'
            case 'regressed': return 'bg-red-50 border-red-200'
            default: return 'bg-gray-50 border-gray-200'
        }
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Disease Progression Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-red-600">
                        Failed to load timeline data
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Disease Progression Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!timelineEntries || timelineEntries.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Disease Progression Timeline</CardTitle>
                    <CardDescription>
                        Timeline visualization requires at least 2 analyses
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-gray-500">
                        <p>No progression data available yet</p>
                        <p className="text-sm mt-2">Create multiple analyses to track disease progression</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Disease Progression Timeline</CardTitle>
                <CardDescription>
                    Track severity changes and clinical progression over time ({timelineEntries.length} analyses)
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-5 top-6 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-gray-300" />

                    {/* Timeline entries */}
                    <div className="space-y-4">
                        {timelineEntries.map((entry, idx) => (
                            <div key={entry.analysis.id} className="relative pl-14">
                                {/* Timeline dot */}
                                <div className={cn(
                                    "absolute left-0 top-2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white",
                                    entry.trend === 'improved' ? 'bg-green-500' :
                                    entry.trend === 'regressed' ? 'bg-red-500' :
                                    'bg-gray-400'
                                )}>
                                    {getTrendIcon(entry.trend)}
                                </div>

                                {/* Analysis card */}
                                <div
                                    className={cn(
                                        "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                                        getTrendColor(entry.trend),
                                        expandedId === entry.analysis.id && 'ring-2 ring-blue-500'
                                    )}
                                    onClick={() => setExpandedId(expandedId === entry.analysis.id ? null : entry.analysis.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-gray-700">
                                                    #{entry.analysis.id}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(entry.analysis.created_at), 'MMM dd, yyyy')}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-sm font-medium">
                                                {entry.analysis.primary_diagnosis || 'No diagnosis'}
                                            </p>

                                            <div className="flex gap-2 mt-2">
                                                <Badge className={cn('text-xs', getSeverityColor(entry.analysis.severity))}>
                                                    {entry.analysis.severity || 'Unknown'}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs gap-1">
                                                    {getTrendIcon(entry.trend)}
                                                    {getTrendLabel(entry.trend)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <div className="text-right">
                                                <p className="text-sm font-semibold">
                                                    {((entry.analysis.confidence_score || 0) * 100).toFixed(0)}%
                                                </p>
                                                <p className="text-xs text-gray-500">Confidence</p>
                                            </div>
                                            {expandedId === entry.analysis.id ? (
                                                <ChevronUp className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded content */}
                                    {expandedId === entry.analysis.id && (
                                        <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
                                            {/* Clinical Findings */}
                                            {entry.analysis.clinical_findings && entry.analysis.clinical_findings.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase text-gray-600 mb-1">
                                                        Clinical Findings
                                                    </p>
                                                    <ul className="text-sm space-y-1">
                                                        {entry.analysis.clinical_findings.map((finding, fidx) => (
                                                            <li key={fidx} className="text-gray-700">
                                                                • {finding}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Differential Diagnoses */}
                                            {entry.analysis.differential_diagnoses && entry.analysis.differential_diagnoses.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase text-gray-600 mb-1">
                                                        Differential Diagnoses
                                                    </p>
                                                    <ul className="text-sm space-y-1">
                                                        {entry.analysis.differential_diagnoses.map((diag: any, didx) => (
                                                            <li key={didx} className="text-gray-700">
                                                                • {diag.name || diag} {diag.probability && `(${(diag.probability * 100).toFixed(0)}%)`}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Recommendations */}
                                            {entry.analysis.recommendations && (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase text-gray-600 mb-1">
                                                        Recommendations
                                                    </p>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                        {typeof entry.analysis.recommendations === 'string'
                                                            ? entry.analysis.recommendations
                                                            : Array.isArray(entry.analysis.recommendations)
                                                                ? entry.analysis.recommendations.join('\n')
                                                                : JSON.stringify(entry.analysis.recommendations, null, 2)}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Doctor Feedback if available */}
                                            {entry.analysis.doctor_feedback && (
                                                <div className="bg-white bg-opacity-50 rounded p-2">
                                                    <p className="text-xs font-semibold uppercase text-gray-600 mb-1">
                                                        Doctor Review
                                                    </p>
                                                    <p className="text-sm text-gray-700 italic">
                                                        {entry.analysis.doctor_feedback}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Trend transition indicator */}
                                {idx < timelineEntries.length - 1 && (
                                    <div className="mt-2 text-center">
                                        <div className={cn(
                                            "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded",
                                            entry.trend === 'improved' ? 'text-green-700 bg-green-100' :
                                            entry.trend === 'regressed' ? 'text-red-700 bg-red-100' :
                                            'text-gray-700 bg-gray-100'
                                        )}>
                                            {getTrendIcon(entry.trend)}
                                            {getTrendLabel(entry.trend)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary statistics */}
                    <div className="mt-6 pt-6 border-t">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {timelineEntries.filter(e => e.trend === 'improved').length}
                                </p>
                                <p className="text-xs text-gray-600">Improvements</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-600">
                                    {timelineEntries.filter(e => e.trend === 'stable').length}
                                </p>
                                <p className="text-xs text-gray-600">Stable</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">
                                    {timelineEntries.filter(e => e.trend === 'regressed').length}
                                </p>
                                <p className="text-xs text-gray-600">Regressions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
