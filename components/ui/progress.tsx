'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  color?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, color = 'var(--accent)', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-overlay)]', className)}
      {...props}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${value || 0}%`, background: color }}
      />
    </div>
  )
)
Progress.displayName = 'Progress'

export { Progress }
