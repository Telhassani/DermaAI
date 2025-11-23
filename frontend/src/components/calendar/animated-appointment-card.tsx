'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AppointmentCard } from './appointment-card'
import { Appointment } from '@/lib/hooks/use-appointments'

interface AnimatedAppointmentCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  appointment: Appointment
  onClick?: (appointment: Appointment) => void
  onEdit?: (appointment: Appointment) => void
  onDelete?: (id: number) => void
  onStatusChange?: (status: string) => void
  compact?: boolean
  showActions?: boolean
  animationDelay?: number
}

export function AnimatedAppointmentCard({
  appointment,
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
  showActions = true,
  animationDelay = 0,
  className,
  ...props
}: AnimatedAppointmentCardProps) {
  return (
    <div className={className} {...props}>
      <AnimatePresence mode="wait">
        <motion.div
          key={appointment.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{
            duration: 0.3,
            delay: animationDelay,
            ease: [0.4, 0, 0.2, 1],
          }}
          layout
          layoutId={`appointment-${appointment.id}`}
        >
          <AppointmentCard
            appointment={appointment}
            onClick={onClick ? () => onClick(appointment) : undefined}
            onEdit={onEdit ? () => onEdit(appointment) : undefined}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            compact={compact}
            showActions={showActions}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
