'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat, Calendar, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { format, addDays, addWeeks, addMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NONE'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number // Every X days/weeks/months
  count?: number // Number of occurrences
  endDate?: Date // Or end by date
  weekDays?: number[] // For weekly: 0=Sunday, 1=Monday, etc.
}

interface RecurrenceSelectorProps {
  value: RecurrenceRule | null
  onChange: (rule: RecurrenceRule | null) => void
  startDate: Date
  className?: string
}

export function RecurrenceSelector({
  value,
  onChange,
  startDate,
  className,
}: RecurrenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(!!value && value.frequency !== 'NONE')
  const [endType, setEndType] = useState<'count' | 'date' | 'never'>(
    value?.count ? 'count' : value?.endDate ? 'date' : 'never'
  )

  const handleToggleRecurrence = () => {
    if (isOpen) {
      onChange(null)
      setIsOpen(false)
    } else {
      onChange({
        frequency: 'WEEKLY',
        interval: 1,
        count: 10,
      })
      setIsOpen(true)
    }
  }

  const handleFrequencyChange = (frequency: RecurrenceFrequency) => {
    if (!value) return
    onChange({
      ...value,
      frequency,
    })
  }

  const handleIntervalChange = (interval: number) => {
    if (!value || interval < 1) return
    onChange({
      ...value,
      interval,
    })
  }

  const handleEndTypeChange = (type: 'count' | 'date' | 'never') => {
    if (!value) return
    setEndType(type)

    const newRule = { ...value }
    delete newRule.count
    delete newRule.endDate

    if (type === 'count') {
      newRule.count = 10
    } else if (type === 'date') {
      const endDate = addMonths(startDate, 3)
      newRule.endDate = endDate
    }

    onChange(newRule)
  }

  const handleCountChange = (count: number) => {
    if (!value || count < 1) return
    onChange({
      ...value,
      count,
      endDate: undefined,
    })
  }

  const handleEndDateChange = (date: string) => {
    if (!value) return
    onChange({
      ...value,
      endDate: new Date(date),
      count: undefined,
    })
  }

  const getPreviewText = () => {
    if (!value || !value.frequency || value.frequency === 'NONE') {
      return 'Aucune récurrence'
    }

    const { frequency, interval, count, endDate } = value

    let text = ''

    // Frequency text
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

    return text
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggleRecurrence}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all',
          isOpen
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <div className="flex items-center gap-3">
          <Repeat className={cn('h-5 w-5', isOpen ? 'text-blue-600' : 'text-gray-400')} />
          <div>
            <p className={cn('font-medium', isOpen ? 'text-blue-900' : 'text-gray-700')}>
              Rendez-vous récurrent
            </p>
            <p className="text-xs text-gray-500">{getPreviewText()}</p>
          </div>
        </div>
        {isOpen && <X className="h-5 w-5 text-blue-600" />}
      </button>

      {/* Recurrence options */}
      <AnimatePresence>
        {isOpen && value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 overflow-hidden rounded-lg border bg-gray-50 p-4"
          >
            {/* Frequency */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Répéter</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'DAILY', label: 'Jour' },
                  { value: 'WEEKLY', label: 'Semaine' },
                  { value: 'MONTHLY', label: 'Mois' },
                ].map((freq) => (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() => handleFrequencyChange(freq.value as RecurrenceFrequency)}
                    className={cn(
                      'rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all',
                      value.frequency === freq.value
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    )}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Tous les
                {value.frequency === 'DAILY' && ' ... jours'}
                {value.frequency === 'WEEKLY' && ' ... semaines'}
                {value.frequency === 'MONTHLY' && ' ... mois'}
              </Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={value.interval}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>

            {/* End condition */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Se termine</Label>
              <div className="space-y-2">
                {/* Never */}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2">
                  <input
                    type="radio"
                    checked={endType === 'never'}
                    onChange={() => handleEndTypeChange('never')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Jamais</span>
                </label>

                {/* After count */}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2">
                  <input
                    type="radio"
                    checked={endType === 'count'}
                    onChange={() => handleEndTypeChange('count')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Après</span>
                  {endType === 'count' && (
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={value.count || 10}
                      onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
                      className="w-20"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  {endType === 'count' && <span className="text-sm text-gray-700">fois</span>}
                </label>

                {/* By date */}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2">
                  <input
                    type="radio"
                    checked={endType === 'date'}
                    onChange={() => handleEndTypeChange('date')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Le</span>
                  {endType === 'date' && (
                    <Input
                      type="date"
                      value={value.endDate ? format(value.endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      min={format(addDays(startDate, 1), 'yyyy-MM-dd')}
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-blue-600" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium">Résumé :</p>
                  <p className="mt-1">{getPreviewText()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
