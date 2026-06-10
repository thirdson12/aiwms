import { cn } from '@/lib/utils';

const variants: Record<string, string> = {
  default: 'bg-slate-100 text-slate-800',
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  open: 'bg-amber-100 text-amber-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  none: 'bg-green-100 text-green-800',
  admin: 'bg-purple-100 text-purple-800',
  owner: 'bg-indigo-100 text-indigo-800',
  worker: 'bg-teal-100 text-teal-800',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    />
  );
}
