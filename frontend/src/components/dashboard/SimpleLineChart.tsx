'use client'

interface DataPoint {
  label: string
  value: number
}

interface SimpleLineChartProps {
  title: string
  data: DataPoint[]
  color?: string
  height?: number
}

export default function SimpleLineChart({
  title,
  data,
  color = '#3b82f6',
  height = 200,
}: SimpleLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex h-32 items-center justify-center text-sm text-gray-500">
          Aucune donnée disponible
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1

  // Calculate points for SVG path
  const width = 600
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const xStep = chartWidth / (data.length - 1 || 1)

  const points = data.map((point, index) => {
    const x = padding + index * xStep
    const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight
    return { x, y, value: point.value }
  })

  // Create path string
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x},${point.y}`
    }
    return `${path} L ${point.x},${point.y}`
  }, '')

  // Create area path (filled area under line)
  const areaPath = `${pathData} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ minWidth: '400px' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = padding + chartHeight * (1 - fraction)
            return (
              <g key={fraction}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {Math.round(minValue + range * fraction)}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          <path d={areaPath} fill={color} fillOpacity="0.1" />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r="4" fill={color} />
              <circle cx={point.x} cy={point.y} r="8" fill={color} fillOpacity="0.2" />
            </g>
          ))}

          {/* X-axis labels */}
          {data.map((point, index) => {
            if (data.length > 15 && index % 3 !== 0) return null
            const x = padding + index * xStep
            return (
              <text
                key={index}
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {point.label.split('-').slice(1).join('-')}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="font-medium text-gray-900">Min:</span>
            <span className="ml-1">{minValue}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-900">Max:</span>
            <span className="ml-1">{maxValue}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-900">Moy:</span>
            <span className="ml-1">
              {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
