import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  illustration?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: 'py-8',
      icon: 'h-10 w-10',
      title: 'text-base',
      description: 'text-xs',
    },
    md: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base',
    },
  }

  const sizeClasses = sizes[size]

  return (
    <div className={`text-center ${sizeClasses.container} ${className}`}>
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mx-auto mb-6">{illustration}</div>
      ) : Icon ? (
        <div className="mx-auto mb-4">
          {typeof Icon === 'function' ? (
            <Icon className={`${sizeClasses.icon} text-slate-300`} />
          ) : (
            Icon
          )}
        </div>
      ) : null}

      {/* Title */}
      <h3 className={`font-semibold text-slate-900 ${sizeClasses.title}`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`mt-2 text-slate-500 ${sizeClasses.description} max-w-sm mx-auto`}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {action && (
            <Button onClick={action.onClick} size={size === 'sm' ? 'sm' : 'default'}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Predefined empty state variants
export function EmptyStateNoPatients({ onCreatePatient }: { onCreatePatient: () => void }) {
  return (
    <EmptyState
      illustration={<EmptyBoxIllustration />}
      title="Aucun patient"
      description="Commencez par ajouter votre premier patient pour gérer vos consultations"
      action={{
        label: 'Ajouter un patient',
        onClick: onCreatePatient,
      }}
    />
  )
}

export function EmptyStateNoResults({ searchQuery }: { searchQuery: string }) {
  return (
    <EmptyState
      illustration={<SearchEmptyIllustration />}
      title="Aucun résultat"
      description={`Aucun résultat trouvé pour "${searchQuery}". Essayez avec d'autres termes.`}
      size="md"
    />
  )
}

export function EmptyStateNoActivity() {
  return (
    <EmptyState
      illustration={<ActivityEmptyIllustration />}
      title="Aucune activité récente"
      description="Les dernières actions et événements apparaîtront ici"
      size="sm"
    />
  )
}

export function EmptyStateNoAppointments({ onSchedule }: { onSchedule: () => void }) {
  return (
    <EmptyState
      illustration={<CalendarEmptyIllustration />}
      title="Aucun rendez-vous"
      description="Vous n'avez aucun rendez-vous programmé pour le moment"
      action={{
        label: 'Planifier un rendez-vous',
        onClick: onSchedule,
      }}
      size="sm"
    />
  )
}

export function EmptyStateNoConsultations({ onCreateConsultation }: { onCreateConsultation: () => void }) {
  return (
    <EmptyState
      illustration={<ConsultationEmptyIllustration />}
      title="Aucune consultation"
      description="Commencez par enregistrer votre première consultation"
      action={{
        label: 'Nouvelle consultation',
        onClick: onCreateConsultation,
      }}
    />
  )
}

// Simple SVG illustrations
function EmptyBoxIllustration() {
  return (
    <svg
      className="mx-auto h-32 w-32"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="40" y="60" width="120" height="100" rx="8" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
      <path d="M60 100h80M60 120h60" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="50" r="20" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
      <path d="M100 40v20M90 50h20" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SearchEmptyIllustration() {
  return (
    <svg
      className="mx-auto h-32 w-32"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="80" r="40" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="3" />
      <circle cx="80" cy="80" r="30" fill="white" />
      <line x1="110" y1="110" x2="140" y2="140" stroke="#FCD34D" strokeWidth="6" strokeLinecap="round" />
      <path d="M70 80h20M80 70v20" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ActivityEmptyIllustration() {
  return (
    <svg
      className="mx-auto h-24 w-24"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="30" y="50" width="140" height="120" rx="12" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
      <circle cx="60" cy="80" r="8" fill="#E5E7EB" />
      <rect x="80" y="74" width="80" height="4" rx="2" fill="#E5E7EB" />
      <rect x="80" y="84" width="60" height="3" rx="1.5" fill="#F3F4F6" />
      <circle cx="60" cy="120" r="8" fill="#E5E7EB" />
      <rect x="80" y="114" width="80" height="4" rx="2" fill="#E5E7EB" />
      <rect x="80" y="124" width="50" height="3" rx="1.5" fill="#F3F4F6" />
    </svg>
  )
}

function CalendarEmptyIllustration() {
  return (
    <svg
      className="mx-auto h-24 w-24"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="40" y="50" width="120" height="110" rx="8" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
      <rect x="40" y="50" width="120" height="30" rx="8" fill="#60A5FA" />
      <line x1="70" y1="40" x2="70" y2="65" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
      <line x1="130" y1="40" x2="130" y2="65" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
      <g opacity="0.5">
        <rect x="55" y="95" width="15" height="12" rx="2" fill="#93C5FD" />
        <rect x="80" y="95" width="15" height="12" rx="2" fill="#93C5FD" />
        <rect x="105" y="95" width="15" height="12" rx="2" fill="#93C5FD" />
        <rect x="130" y="95" width="15" height="12" rx="2" fill="#93C5FD" />
        <rect x="55" y="120" width="15" height="12" rx="2" fill="#93C5FD" />
        <rect x="80" y="120" width="15" height="12" rx="2" fill="#93C5FD" />
      </g>
    </svg>
  )
}

function ConsultationEmptyIllustration() {
  return (
    <svg
      className="mx-auto h-32 w-32"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="35" y="50" width="130" height="110" rx="12" fill="#F0FDFA" stroke="#5EEAD4" strokeWidth="2" />
      <circle cx="65" cy="85" r="12" fill="#99F6E4" />
      <rect x="85" y="75" width="75" height="6" rx="3" fill="#5EEAD4" />
      <rect x="85" y="87" width="60" height="4" rx="2" fill="#99F6E4" />
      <rect x="50" y="115" width="100" height="3" rx="1.5" fill="#CCFBF1" />
      <rect x="50" y="125" width="90" height="3" rx="1.5" fill="#CCFBF1" />
      <rect x="50" y="135" width="85" height="3" rx="1.5" fill="#CCFBF1" />
      <path d="M60 75l5 5 10-10" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
