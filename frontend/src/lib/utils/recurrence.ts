import { addDays, addWeeks, addMonths, isBefore, isAfter, format } from 'date-fns'

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NONE'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number
  count?: number
  endDate?: Date
  weekDays?: number[]
}

export interface RecurrenceOccurrence {
  start_time: Date
  end_time: Date
  index: number
}

/**
 * Generate occurrences from a recurrence rule
 */
export function generateRecurrenceOccurrences(
  startTime: Date,
  endTime: Date,
  rule: RecurrenceRule,
  maxOccurrences: number = 365
): RecurrenceOccurrence[] {
  if (!rule || rule.frequency === 'NONE') {
    return []
  }

  const occurrences: RecurrenceOccurrence[] = []
  const duration = endTime.getTime() - startTime.getTime()

  let currentStart = new Date(startTime)
  let currentEnd = new Date(endTime)
  let count = 0

  // Determine the increment function based on frequency
  const incrementDate = (date: Date): Date => {
    switch (rule.frequency) {
      case 'DAILY':
        return addDays(date, rule.interval)
      case 'WEEKLY':
        return addWeeks(date, rule.interval)
      case 'MONTHLY':
        return addMonths(date, rule.interval)
      default:
        return date
    }
  }

  // Generate occurrences
  while (count < maxOccurrences) {
    // Check count limit
    if (rule.count && count >= rule.count) {
      break
    }

    // Check end date limit
    if (rule.endDate && isAfter(currentStart, rule.endDate)) {
      break
    }

    // Add occurrence
    occurrences.push({
      start_time: new Date(currentStart),
      end_time: new Date(currentEnd),
      index: count,
    })

    count++

    // Move to next occurrence
    const nextStart = incrementDate(currentStart)
    const nextEnd = new Date(nextStart.getTime() + duration)

    // Safety check: prevent infinite loops
    if (nextStart.getTime() <= currentStart.getTime()) {
      break
    }

    currentStart = nextStart
    currentEnd = nextEnd
  }

  return occurrences
}

/**
 * Generate appointment data for each occurrence
 */
export function generateRecurringAppointments(
  baseAppointment: any,
  recurrenceRule: RecurrenceRule
): any[] {
  const startTime = new Date(baseAppointment.start_time)
  const endTime = new Date(baseAppointment.end_time)

  const occurrences = generateRecurrenceOccurrences(startTime, endTime, recurrenceRule)

  return occurrences.map((occurrence, index) => ({
    ...baseAppointment,
    start_time: occurrence.start_time.toISOString(),
    end_time: occurrence.end_time.toISOString(),
    // Add metadata to track series
    is_recurring: true,
    recurrence_index: index,
    recurrence_total: occurrences.length,
  }))
}

/**
 * Format recurrence rule to human-readable string
 */
export function formatRecurrenceRule(rule: RecurrenceRule, locale: 'fr' | 'en' = 'fr'): string {
  if (!rule || rule.frequency === 'NONE') {
    return locale === 'fr' ? 'Aucune récurrence' : 'No recurrence'
  }

  const { frequency, interval, count, endDate } = rule

  let text = ''

  // Frequency text
  if (locale === 'fr') {
    if (frequency === 'DAILY') {
      text = interval === 1 ? 'Tous les jours' : `Tous les ${interval} jours`
    } else if (frequency === 'WEEKLY') {
      text = interval === 1 ? 'Toutes les semaines' : `Toutes les ${interval} semaines`
    } else if (frequency === 'MONTHLY') {
      text = interval === 1 ? 'Tous les mois' : `Tous les ${interval} mois`
    }

    // End text
    if (count) {
      text += `, ${count} fois`
    } else if (endDate) {
      text += ` jusqu'au ${format(endDate, 'dd/MM/yyyy')}`
    }
  } else {
    if (frequency === 'DAILY') {
      text = interval === 1 ? 'Every day' : `Every ${interval} days`
    } else if (frequency === 'WEEKLY') {
      text = interval === 1 ? 'Every week' : `Every ${interval} weeks`
    } else if (frequency === 'MONTHLY') {
      text = interval === 1 ? 'Every month' : `Every ${interval} months`
    }

    if (count) {
      text += `, ${count} times`
    } else if (endDate) {
      text += ` until ${format(endDate, 'MM/dd/yyyy')}`
    }
  }

  return text
}

/**
 * Validate recurrence rule
 */
export function validateRecurrenceRule(rule: RecurrenceRule): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!rule.frequency || rule.frequency === 'NONE') {
    return { valid: true, errors: [] }
  }

  if (!rule.interval || rule.interval < 1) {
    errors.push('Interval must be at least 1')
  }

  if (rule.interval > 365) {
    errors.push('Interval cannot exceed 365')
  }

  if (rule.count !== undefined) {
    if (rule.count < 1) {
      errors.push('Count must be at least 1')
    }
    if (rule.count > 365) {
      errors.push('Count cannot exceed 365 occurrences')
    }
  }

  if (rule.endDate && rule.count) {
    errors.push('Cannot specify both count and end date')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
