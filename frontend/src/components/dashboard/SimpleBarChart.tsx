'use client'

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface SimpleBarChartProps {
  title: string
  data: DataPoint[]
  maxValue?: number
  height?: number
  showValues?: boolean
}

export default function SimpleBarChart({
  title,
  data,
  maxValue,
  height = 200,
  showValues = true,
}: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value))

  const defaultColors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#8b5cf6', // purple-500
    '#f59e0b', // orange-500
    '#ef4444', // red-500
    '#6b7280', // gray-500
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / max) * 100
          const color = item.color || defaultColors[index % defaultColors.length]

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.label}</span>
                {showValues && (
                  <span className="font-semibold text-gray-900">{item.value}</span>
                )}
              </div>
              <div className="h-8 w-full overflow-hidden rounded-md bg-gray-100">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {data.length === 0 && (
        <div className="flex h-32 items-center justify-center text-sm text-gray-500">
          Aucune donnée disponible
        </div>
      )}
    </div>
  )
}
