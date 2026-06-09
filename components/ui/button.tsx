import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm',
        destructive:
          'bg-[var(--red-subtle)] text-[#F87171] border border-[rgba(220,38,38,0.3)] hover:bg-[rgba(220,38,38,0.15)]',
        outline:
          'border border-[var(--border-md)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)]',
        secondary:
          'bg-[var(--bg-raised)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text)]',
        ghost:
          'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)]',
        link:
          'text-[var(--accent)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded px-3 text-xs',
        lg: 'h-10 rounded-md px-6 text-sm',
        xl: 'h-11 rounded-md px-8',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7 rounded',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
