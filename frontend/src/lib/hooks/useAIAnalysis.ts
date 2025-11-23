import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiAnalysisApi, AIAnalysisCreate, AIAnalysisUpdate } from '@/lib/api/ai-analysis'
import { toast } from 'sonner'

export const useAnalyzeImage = () => {
    return useMutation({
        mutationFn: async (data: AIAnalysisCreate) => {
            const response = await aiAnalysisApi.analyze(data)
            return response.data
        },
        onError: (error: any) => {
            console.error('Analysis failed:', error)
            toast.error('Échec de l\'analyse : ' + (error.response?.data?.detail || error.message))
        },
    })
}

export const useAIAnalysis = (id: number) => {
    return useQuery({
        queryKey: ['ai-analysis', id],
        queryFn: async () => {
            const response = await aiAnalysisApi.get(id)
            return response.data
        },
        enabled: !!id,
    })
}

export const useUpdateAIAnalysis = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: AIAnalysisUpdate }) => {
            const response = await aiAnalysisApi.update(id, data)
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['ai-analysis', data.id] })
            toast.success('Analyse mise à jour avec succès')
        },
        onError: (error: any) => {
            console.error('Update failed:', error)
            toast.error('Erreur lors de la mise à jour')
        },
    })
}
