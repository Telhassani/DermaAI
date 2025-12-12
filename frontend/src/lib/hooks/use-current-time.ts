'use client'

import { useState, useEffect } from 'react'

export function useCurrentTime() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)

    useEffect(() => {
        // Set initial time on mount
        setCurrentTime(new Date())

        // Update every minute (or 30s to be safer/smoother)
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    return currentTime
}
