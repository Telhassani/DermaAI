'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { AIAnalysisResponse, Severity, AnalysisStatus, getPatientAnalysisHistory } from '@/lib/api/ai-analysis'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Filter, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIAnalysisHistoryProps {
    patientId: number
    onViewAnalysis?: (analysis: AIAnalysisResponse) => void
    className?: string
}

export function AIAnalysisHistory({ patientId, onViewAnalysis, className }: AIAnalysisHistoryProps) {
    const [page, setPage] = useState(0)
    const [pageSize] = useState(10)
    const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL')
    const [statusFilter, setStatusFilter] = useState<AnalysisStatus | 'ALL'>('ALL')
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch analysis history
    const { data, isLoading, error } = useQuery({
        queryKey: ['patientAnalysisHistory', patientId, page, pageSize],
        queryFn: () => getPatientAnalysisHistory(patientId, page * pageSize, pageSize),
        enabled: !!patientId,
    })

    // Filter analyses based on search and filters
    const filteredAnalyses = useMemo(() => {
        if (!data?.items) return []

        return data.items.filter(analysis => {
            const matchesSeverity = severityFilter === 'ALL' || analysis.severity === severityFilter
            const matchesStatus = statusFilter === 'ALL' || analysis.status === statusFilter
            const matchesSearch = searchTerm === '' ||
                analysis.primary_diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                analysis.id.toString().includes(searchTerm)

            return matchesSeverity && matchesStatus && matchesSearch
        })
    }, [data?.items, severityFilter, statusFilter, searchTerm])

    const getSeverityColor = (severity?: Severity) => {
        switch (severity) {
            case Severity.BENIGN:
                return 'bg-green-100 text-green-800'
            case Severity.MILD:
                return 'bg-blue-100 text-blue-800'
            case Severity.MODERATE:
                return 'bg-yellow-100 text-yellow-800'
            case Severity.SEVERE:
                return 'bg-orange-100 text-orange-800'
            case Severity.CRITICAL:
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusColor = (status?: AnalysisStatus) => {
        switch (status) {
            case AnalysisStatus.PENDING:
                return 'bg-amber-100 text-amber-800'
            case AnalysisStatus.REVIEWED:
                return 'bg-blue-100 text-blue-800'
            case AnalysisStatus.ACCEPTED:
                return 'bg-green-100 text-green-800'
            case AnalysisStatus.REJECTED:
                return 'bg-red-100 text-red-800'
            case AnalysisStatus.MODIFIED:
                return 'bg-purple-100 text-purple-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getConfidenceColor = (score?: number) => {
        if (!score) return 'text-gray-500'
        if (score >= 0.9) return 'text-green-600 font-semibold'
        if (score >= 0.7) return 'text-yellow-600 font-semibold'
        return 'text-red-600 font-semibold'
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Analysis History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-red-600">
                        Failed to load analysis history
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Analysis History</CardTitle>
                        <CardDescription>
                            {data?.total || 0} analyses for this patient
                        </CardDescription>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 mt-6">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                Search by diagnosis
                            </label>
                            <Input
                                placeholder="e.g., dermatitis, eczema..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setPage(0)
                                }}
                                className="text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                Severity
                            </label>
                            <Select value={severityFilter} onValueChange={(value: any) => {
                                setSeverityFilter(value)
                                setPage(0)
                            }}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Severities</SelectItem>
                                    <SelectItem value={Severity.BENIGN}>Benign</SelectItem>
                                    <SelectItem value={Severity.MILD}>Mild</SelectItem>
                                    <SelectItem value={Severity.MODERATE}>Moderate</SelectItem>
                                    <SelectItem value={Severity.SEVERE}>Severe</SelectItem>
                                    <SelectItem value={Severity.CRITICAL}>Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                Status
                            </label>
                            <Select value={statusFilter} onValueChange={(value: any) => {
                                setStatusFilter(value)
                                setPage(0)
                            }}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value={AnalysisStatus.PENDING}>Pending</SelectItem>
                                    <SelectItem value={AnalysisStatus.REVIEWED}>Reviewed</SelectItem>
                                    <SelectItem value={AnalysisStatus.ACCEPTED}>Accepted</SelectItem>
                                    <SelectItem value={AnalysisStatus.REJECTED}>Rejected</SelectItem>
                                    <SelectItem value={AnalysisStatus.MODIFIED}>Modified</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : filteredAnalyses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Filter className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p>No analyses match your filters</p>
                    </div>
                ) : (
                    <>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Diagnosis</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Confidence</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAnalyses.map((analysis) => (
                                        <TableRow key={analysis.id} className="hover:bg-gray-50">
                                            <TableCell className="font-mono text-sm">
                                                #{analysis.id}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(analysis.created_at), 'MMM dd, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-sm max-w-xs truncate">
                                                {analysis.primary_diagnosis || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn('text-xs', getSeverityColor(analysis.severity))}>
                                                    {analysis.severity || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn('text-sm', getConfidenceColor(analysis.confidence_score))}>
                                                    {analysis.confidence_score ? `${(analysis.confidence_score * 100).toFixed(0)}%` : 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn('text-xs', getStatusColor(analysis.status))}>
                                                    {analysis.status || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onViewAnalysis?.(analysis)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {data && data.total > pageSize && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-600">
                                    Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, data.total)} of {data.total}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(Math.max(0, page - 1))}
                                        disabled={page === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(page + 1)}
                                        disabled={(page + 1) * pageSize >= (data?.total || 0)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
