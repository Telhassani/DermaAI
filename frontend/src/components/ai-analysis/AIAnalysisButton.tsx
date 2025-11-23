import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { AIAnalysisModal } from './AIAnalysisModal'
import { AIAnalysisResponse } from '@/lib/api/ai-analysis'
import { cn } from '@/lib/utils'

interface AIAnalysisButtonProps {
    imageSrc: string
    patientId: number
    consultationId?: number
    onAnalysisComplete?: (analysis: AIAnalysisResponse) => void
    className?: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    label?: string
}

export function AIAnalysisButton({
    imageSrc,
    patientId,
    consultationId,
    onAnalysisComplete,
    className,
    variant = "default",
    size = "default",
    label = "Analyser avec IA"
}: AIAnalysisButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={cn(
                    "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0",
                    className
                )}
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsModalOpen(true)
                }}
            >
                <Sparkles className={cn("h-4 w-4", label ? "mr-2" : "")} />
                {label}
            </Button>

            <AIAnalysisModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageSrc={imageSrc}
                patientId={patientId}
                consultationId={consultationId}
                onAnalysisComplete={onAnalysisComplete}
            />
        </>
    )
}
