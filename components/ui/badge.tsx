import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium border',
  {
    variants: {
      variant: {
        default:
          'border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]',
        success:
          'border-[rgba(22,163,74,0.3)] bg-[var(--green-subtle)] text-[#4ADE80]',
        warning:
          'border-[rgba(217,119,6,0.3)] bg-[var(--amber-subtle)] text-[#FCD34D]',
        destructive:
          'border-[rgba(220,38,38,0.3)] bg-[var(--red-subtle)] text-[#F87171]',
        secondary:
          'border-[var(--border)] bg-[var(--bg-overlay)] text-[var(--text-muted)]',
        outline:
          'border-[var(--border-md)] text-[var(--text-muted)] bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
