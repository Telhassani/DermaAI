/**
 * Role Badge Component
 * Displays user role with color-coded badge
 */

import { Badge } from '@/components/ui/badge'

const roleConfig = {
  ADMIN: { label: 'Administrateur', variant: 'destructive' as const },
  DOCTOR: { label: 'Docteur', variant: 'default' as const },
  ASSISTANT: { label: 'Assistant', variant: 'secondary' as const },
  SECRETARY: { label: 'Secrétaire', variant: 'outline' as const },
}

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role as keyof typeof roleConfig] || {
    label: role,
    variant: 'default' as const
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
}
