import { useState, useEffect } from 'react'
import { AnimatedModal } from '@/components/ui/animated-modal'
import { Button } from '@/components/ui/button'
import { AIAnalysisResultCard } from './AIAnalysisResultCard'
import { ModelSelector } from './ModelSelector'
import { useAnalyzeImage } from '@/hooks/useAIAnalysis'
import { useAIStreamStore } from '@/lib/stores/ai-stream-store'
import { AnalysisType, AIAnalysisResponse } from '@/lib/api/ai-analysis'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AIAnalysisModalProps {
    isOpen: boolean
    onClose: () => void
    imageSrc: string
    patientId: number
    consultationId?: number
    onAnalysisComplete?: (analysis: AIAnalysisResponse) => void
}

export function AIAnalysisModal({
    isOpen,
    onClose,
    imageSrc,
    patientId,
    consultationId,
    onAnalysisComplete,
}: AIAnalysisModalProps) {
    const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null)
    const { mutate: analyze, isPending, error } = useAnalyzeImage()
    const { selectedModel } = useAIStreamStore()

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setAnalysis(null)
        }
    }, [isOpen])

    const handleAnalyze = async () => {
        // Convert imageSrc to base64 if it's a URL (assuming it's a blob or we need to fetch it)
        // For now, let's assume imageSrc is already a base64 string or a URL we can send.
        // If it's a URL, we might need to fetch it and convert to base64, or the backend handles URLs.
        // The backend expects `image_data` as base64.

        let base64Image = imageSrc

        if (imageSrc.startsWith('http') || imageSrc.startsWith('blob:')) {
            try {
                const response = await fetch(imageSrc)
                const blob = await response.blob()
                base64Image = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(blob)
                })
            } catch (e) {
                console.error("Error converting image to base64", e)
                toast.error("Erreur lors de la préparation de l'image")
                return
            }
        }

        // Remove header if present (data:image/jpeg;base64,)
        const base64Data = base64Image.split(',')[1] || base64Image

        analyze(
            {
                analysis_type: AnalysisType.IMAGE,
                patient_id: patientId,
                consultation_id: consultationId,
                image_data: base64Data,
                ai_model: selectedModel || undefined,
            },
            {
                onSuccess: (data) => {
                    setAnalysis(data)
                    if (onAnalysisComplete) {
                        onAnalysisComplete(data)
                    }
                    toast.success("Analyse terminée avec succès")
                },
            }
        )
    }

    return (
        <AnimatedModal
            isOpen={isOpen}
            onClose={onClose}
            title="Analyse IA Dermatologique"
            description="Analyse de l'image par intelligence artificielle pour aide au diagnostic."
            size="lg"
        >
            <div className="space-y-6">
                {/* Model Selection */}
                <ModelSelector
                    label="Modèle IA"
                    description="Sélectionnez le modèle IA pour analyser cette image"
                    showMetadata={true}
                />

                {/* Image and Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Image */}
                    <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border bg-gray-100 aspect-square flex items-center justify-center">
                            {imageSrc ? (
                                <img
                                    src={imageSrc}
                                    alt="Analysis target"
                                    className="object-contain max-h-full max-w-full"
                                />
                            ) : (
                                <div className="text-gray-400">Aucune image sélectionnée</div>
                            )}
                        </div>

                        {!analysis && (
                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={isPending || !imageSrc}
                                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analyse en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Lancer l'analyse
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-gray-500 text-center">
                                    L'analyse peut prendre quelques secondes.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Results or Placeholder */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {error ? (
                            <div className="rounded-lg bg-red-50 p-4 border border-red-100 text-red-800 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Erreur d'analyse</h4>
                                    <p className="text-sm mt-1">
                                        Une erreur est survenue lors de l'analyse. Veuillez réessayer.
                                    </p>
                                </div>
                            </div>
                        ) : analysis ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <AIAnalysisResultCard analysis={analysis} />
                                <div className="mt-4 flex justify-end">
                                    <Button variant="outline" onClick={onClose}>
                                        Fermer
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 border-2 border-dashed rounded-lg">
                                <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                                <h3 className="font-medium text-gray-900 mb-1">Prêt à analyser</h3>
                                <p className="text-sm">
                                    Cliquez sur "Lancer l'analyse" pour obtenir une évaluation IA de cette image.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                {/* End of Grid */}
            </div>
        </AnimatedModal>
    )
}
