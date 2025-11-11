import { toast as sonnerToast } from 'sonner'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      icon: '✓',
    })
  },

  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      icon: '✕',
    })
  },

  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      icon: 'ℹ',
    })
  },

  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      icon: '⚠',
    })
  },

  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    })
  },

  // Toast with custom action button
  withAction: (
    message: string,
    {
      description,
      actionLabel,
      onAction,
      cancelLabel,
    }: {
      description?: string
      actionLabel: string
      onAction: () => void
      cancelLabel?: string
    }
  ) => {
    return sonnerToast(message, {
      description,
      action: {
        label: actionLabel,
        onClick: onAction,
      },
      cancel: cancelLabel
        ? {
            label: cancelLabel,
            onClick: () => {},
          }
        : undefined,
    })
  },

  // Toast for undo actions (like delete)
  undo: (
    message: string,
    {
      description,
      onUndo,
      duration = 5000,
    }: {
      description?: string
      onUndo: () => void
      duration?: number
    }
  ) => {
    return sonnerToast.success(message, {
      description,
      duration,
      action: {
        label: 'Annuler',
        onClick: onUndo,
      },
    })
  },

  // Dismiss a specific toast
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },

  // Dismiss all toasts
  dismissAll: () => {
    sonnerToast.dismiss()
  },
}

// Common toast messages for CRUD operations
export const toastMessages = {
  patient: {
    created: (name: string) => ({
      title: 'Patient créé',
      description: `${name} a été ajouté avec succès`,
    }),
    updated: (name: string) => ({
      title: 'Patient modifié',
      description: `Les informations de ${name} ont été mises à jour`,
    }),
    deleted: (name: string) => ({
      title: 'Patient supprimé',
      description: `${name} a été supprimé`,
    }),
    deleteError: {
      title: 'Erreur',
      description: 'Impossible de supprimer le patient',
    },
  },

  consultation: {
    created: {
      title: 'Consultation enregistrée',
      description: 'La consultation a été créée avec succès',
    },
    updated: {
      title: 'Consultation modifiée',
      description: 'La consultation a été mise à jour',
    },
    deleted: {
      title: 'Consultation supprimée',
      description: 'La consultation a été supprimée',
    },
  },

  auth: {
    loginSuccess: {
      title: 'Connexion réussie',
      description: 'Bienvenue dans DermAI',
    },
    loginError: {
      title: 'Erreur de connexion',
      description: 'Email ou mot de passe incorrect',
    },
    logoutSuccess: {
      title: 'Déconnexion réussie',
      description: 'À bientôt !',
    },
  },

  error: {
    network: {
      title: 'Erreur réseau',
      description: 'Impossible de se connecter au serveur',
    },
    unknown: {
      title: 'Erreur',
      description: 'Une erreur inattendue s\'est produite',
    },
  },
}
