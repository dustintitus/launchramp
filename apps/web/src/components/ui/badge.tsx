import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-neutral-900 text-white',
        secondary:
          'bg-neutral-100 text-neutral-700',
        outline: 'border border-neutral-200 text-neutral-700',
        lead: 'bg-amber-50 text-amber-800',
        qualified: 'bg-blue-50 text-blue-800',
        customer: 'bg-emerald-50 text-emerald-800',
        churned: 'bg-neutral-100 text-neutral-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
