/**
 * Patient Card Skeleton Component
 * Loading skeleton for patient cards
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/theme'

interface PatientCardSkeletonProps {
  count?: number
}

export default function PatientCardSkeleton({ count = 6 }: PatientCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} index={index} />
      ))}
    </>
  )
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'rounded-2xl border border-mono-200 bg-white p-6',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]'
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar Skeleton */}
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-mono-200">
            <div className="shimmer-effect absolute inset-0" />
          </div>

          <div className="space-y-2">
            {/* Name Skeleton */}
            <div className="relative h-5 w-32 overflow-hidden rounded-lg bg-mono-200">
              <div className="shimmer-effect absolute inset-0" />
            </div>

            {/* Age & Status Skeleton */}
            <div className="flex items-center gap-2">
              <div className="relative h-4 w-12 overflow-hidden rounded bg-mono-200">
                <div className="shimmer-effect absolute inset-0" />
              </div>
              <div className="relative h-5 w-16 overflow-hidden rounded-full bg-mono-200">
                <div className="shimmer-effect absolute inset-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Button Skeleton */}
        <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-mono-200">
          <div className="shimmer-effect absolute inset-0" />
        </div>
      </div>

      {/* Contact Info Skeletons */}
      <div className="mb-4 space-y-2">
        {/* Email */}
        <div className="flex items-center gap-2">
          <div className="relative h-4 w-4 overflow-hidden rounded bg-mono-200">
            <div className="shimmer-effect absolute inset-0" />
          </div>
          <div className="relative h-4 w-48 overflow-hidden rounded bg-mono-200">
            <div className="shimmer-effect absolute inset-0" />
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <div className="relative h-4 w-4 overflow-hidden rounded bg-mono-200">
            <div className="shimmer-effect absolute inset-0" />
          </div>
          <div className="relative h-4 w-32 overflow-hidden rounded bg-mono-200">
            <div className="shimmer-effect absolute inset-0" />
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-2">
          <div className="relative h-4 w-4 overflow-hidden rounded bg-mono-200">
            <div className="shimmer-effect absolute inset-0" />
          </div>
          <div className="relative h-4 w-40 overflow-hidden rounded bg-mono-200">
            <div className="shimmer-effect absolute inset-0" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 border-t border-mono-100 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            {/* Icon */}
            <div className="mb-1 flex items-center justify-center">
              <div className="relative h-4 w-4 overflow-hidden rounded bg-mono-200">
                <div className="shimmer-effect absolute inset-0" />
              </div>
            </div>

            {/* Count */}
            <div className="mx-auto mb-2 h-7 w-12 overflow-hidden rounded bg-mono-200">
              <div className="shimmer-effect absolute inset-0" />
            </div>

            {/* Label */}
            <div className="mx-auto h-3 w-20 overflow-hidden rounded bg-mono-200">
              <div className="shimmer-effect absolute inset-0" />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </motion.div>
  )
}
