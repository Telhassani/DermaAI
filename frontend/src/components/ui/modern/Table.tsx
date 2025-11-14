/**
 * Table Component
 * Modern responsive table with sorting and hover effects
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/theme'

export interface TableColumn<T> {
  key: string
  header: string
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  keyExtractor: (item: T, index: number) => string | number
  onRowClick?: (item: T, index: number) => void
  hoverable?: boolean
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  loading?: boolean
  emptyMessage?: string
  className?: string
}

type SortDirection = 'asc' | 'desc' | null

export default function Table<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  hoverable = true,
  striped = false,
  bordered = true,
  compact = false,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  className,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue === bValue) return 0

      const comparison = aValue > bValue ? 1 : -1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-mono-200 bg-white">
        <TableSkeleton rows={5} columns={columns.length} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl',
        bordered && 'border border-mono-200',
        'bg-white shadow-soft',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead
            className={cn(
              'border-b border-mono-200 bg-gradient-to-b from-mono-50 to-white'
            )}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{ width: column.width }}
                  className={cn(
                    compact ? 'px-4 py-3' : 'px-6 py-4',
                    'text-xs font-semibold uppercase tracking-wider text-mono-600',
                    getAlignClass(column.align),
                    column.sortable && 'cursor-pointer select-none hover:bg-mono-100/50',
                    'transition-colors duration-150'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}
                  >
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-4 w-4 text-accent-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-accent-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-4 w-4 text-mono-400" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-mono-200">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-mono-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <motion.tr
                  key={keyExtractor(item, index)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  onClick={() => onRowClick?.(item, index)}
                  className={cn(
                    'transition-colors duration-150',
                    hoverable && 'hover:bg-accent-50/50',
                    striped && index % 2 === 0 && 'bg-mono-50/30',
                    onRowClick && 'cursor-pointer active:bg-accent-100/50'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        compact ? 'px-4 py-3' : 'px-6 py-4',
                        'text-sm text-mono-700',
                        getAlignClass(column.align)
                      )}
                    >
                      {column.render
                        ? column.render(item, index)
                        : item[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Table Skeleton Loader
 */
function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-mono-200 bg-mono-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 w-20 animate-pulse rounded bg-mono-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-mono-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 w-full animate-pulse rounded bg-mono-200" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Table Cell Helpers
 */
export function TableBadge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const variants = {
    default: 'bg-mono-100 text-mono-700',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-accent-100 text-accent-700',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        variants[variant]
      )}
    >
      {children}
    </span>
  )
}
