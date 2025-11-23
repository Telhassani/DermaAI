'use client'

import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Check, X, Edit2 } from 'lucide-react'
import {
    AIAnalysisResponse,
    AnalysisStatus,
    updateAIAnalysis,
    Severity
} from '@/lib/api/ai-analysis'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface AIAnalysisReviewModalProps {
    analysis: AIAnalysisResponse | null
    isOpen: boolean
    onClose: () => void
}

export function AIAnalysisReviewModal({ analysis, isOpen, onClose }: AIAnalysisReviewModalProps) {
    const [feedback, setFeedback] = useState('')
    const [rating, setRating] = useState<number>(3)
    const [modifiedDiagnosis, setModifiedDiagnosis] = useState('')
    const [reviewAction, setReviewAction] = useState<'accept' | 'reject' | 'modify' | null>(null)
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateAIAnalysis(analysis!.id, data),
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Analysis has been updated successfully',
            })
            queryClient.invalidateQueries({ queryKey: ['patientAnalysisHistory'] })
            resetForm()
            onClose()
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to update analysis',
                variant: 'destructive',
            })
        }
    })

    const resetForm = () => {
        setFeedback('')
        setRating(3)
        setModifiedDiagnosis('')
        setReviewAction(null)
    }

    const handleReview = (action: 'accept' | 'reject' | 'modify') => {
        if (!analysis) return

        const updateData: any = {
            status: action === 'accept' ? AnalysisStatus.ACCEPTED : action === 'reject' ? AnalysisStatus.REJECTED : AnalysisStatus.MODIFIED,
            doctor_feedback: feedback,
            feedback_rating: rating,
        }

        if (action === 'modify' && modifiedDiagnosis) {
            updateData.doctor_modified_diagnosis = modifiedDiagnosis
        }

        updateMutation.mutate(updateData)
    }

    if (!analysis) return null

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Review AI Analysis #{analysis.id}</span>
                        <Badge className={getSeverityColor(analysis.severity)}>
                            {analysis.severity}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Review and provide feedback on this AI-generated analysis
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="analysis" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
                        <TabsTrigger value="review">Your Review</TabsTrigger>
                    </TabsList>

                    {/* Analysis Results Tab */}
                    <TabsContent value="analysis" className="space-y-4 mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Primary Diagnosis</label>
                                <p className="mt-1 text-lg text-gray-900">{analysis.primary_diagnosis || 'N/A'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Confidence Score</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={cn('h-full transition-all', {
                                                    'bg-red-500': (analysis.confidence_score || 0) < 0.6,
                                                    'bg-yellow-500': (analysis.confidence_score || 0) >= 0.6 && (analysis.confidence_score || 0) < 0.8,
                                                    'bg-green-500': (analysis.confidence_score || 0) >= 0.8,
                                                })}
                                                style={{ width: `${(analysis.confidence_score || 0) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {((analysis.confidence_score || 0) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Severity Level</label>
                                    <p className="mt-1 text-sm">{analysis.severity || 'Unknown'}</p>
                                </div>
                            </div>

                            {analysis.differential_diagnoses && analysis.differential_diagnoses.length > 0 && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Differential Diagnoses</label>
                                    <ul className="mt-2 space-y-1">
                                        {analysis.differential_diagnoses.map((diag: any, idx) => (
                                            <li key={idx} className="text-sm text-gray-700">
                                                • {diag.name || diag} {diag.probability && `(${(diag.probability * 100).toFixed(0)}%)`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.clinical_findings && analysis.clinical_findings.length > 0 && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Clinical Findings</label>
                                    <ul className="mt-2 space-y-1">
                                        {analysis.clinical_findings.map((finding: string, idx) => (
                                            <li key={idx} className="text-sm text-gray-700">
                                                • {finding}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.recommendations && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Recommendations</label>
                                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                                        {typeof analysis.recommendations === 'string'
                                            ? analysis.recommendations
                                            : JSON.stringify(analysis.recommendations, null, 2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Review Tab */}
                    <TabsContent value="review" className="space-y-4 mt-4">
                        {analysis.status === AnalysisStatus.PENDING ? (
                            <>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-700">
                                        This analysis is pending your review. Accept, reject, or modify the AI findings below.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                                        Your Feedback
                                    </label>
                                    <Textarea
                                        placeholder="Provide your clinical observations, notes on agreement/disagreement, or additional findings..."
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                                        Rating (1-5 stars)
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRating(star)}
                                                className={cn('text-2xl transition-colors', {
                                                    'text-yellow-400': star <= rating,
                                                    'text-gray-300': star > rating,
                                                })}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                                        Modified Diagnosis (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="If you disagree with the AI diagnosis, enter your diagnosis here..."
                                        value={modifiedDiagnosis}
                                        onChange={(e) => setModifiedDiagnosis(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Action</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            variant={reviewAction === 'accept' ? 'default' : 'outline'}
                                            onClick={() => setReviewAction('accept')}
                                            className={cn('gap-2', {
                                                'bg-green-600 hover:bg-green-700': reviewAction === 'accept',
                                            })}
                                        >
                                            <Check className="h-4 w-4" />
                                            Accept
                                        </Button>
                                        <Button
                                            variant={reviewAction === 'modify' ? 'default' : 'outline'}
                                            onClick={() => setReviewAction('modify')}
                                            className={cn('gap-2', {
                                                'bg-blue-600 hover:bg-blue-700': reviewAction === 'modify',
                                            })}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            Modify
                                        </Button>
                                        <Button
                                            variant={reviewAction === 'reject' ? 'destructive' : 'outline'}
                                            onClick={() => setReviewAction('reject')}
                                            className={cn('gap-2', {
                                                'bg-red-600 hover:bg-red-700': reviewAction === 'reject',
                                            })}
                                        >
                                            <X className="h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-sm text-amber-700">
                                    This analysis has already been reviewed with status: <strong>{analysis.status}</strong>
                                </p>
                                {analysis.doctor_feedback && (
                                    <div className="mt-3 text-sm">
                                        <p className="font-semibold text-amber-900">Previous Feedback:</p>
                                        <p className="mt-1 text-amber-800">{analysis.doctor_feedback}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {analysis.status === AnalysisStatus.PENDING && reviewAction && (
                        <Button
                            onClick={() => handleReview(reviewAction)}
                            disabled={updateMutation.isPending}
                            className={cn('gap-2', {
                                'bg-green-600 hover:bg-green-700': reviewAction === 'accept',
                                'bg-blue-600 hover:bg-blue-700': reviewAction === 'modify',
                                'bg-red-600 hover:bg-red-700': reviewAction === 'reject',
                            })}
                        >
                            {updateMutation.isPending ? 'Submitting...' : `${reviewAction.charAt(0).toUpperCase() + reviewAction.slice(1)} Analysis`}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
