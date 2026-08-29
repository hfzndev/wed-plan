import * as React from 'react';
import { cn } from '@/lib/cn';

const dasar =
  'w-full rounded-md border border-garis-kuat bg-permukaan px-3 text-tinta placeholder:text-tinta-samar disabled:opacity-60';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(dasar, 'h-11', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(dasar, 'min-h-20 py-2 leading-relaxed', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(dasar, 'h-11 appearance-none pr-8', className)} {...props} />
));
Select.displayName = 'Select';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm text-tinta-lembut', className)} {...props} />;
}

/** Label + kontrol + pesan error dalam satu blok vertikal. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4', className)}>
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-tinta-samar">{hint}</p>}
      {error && <p className="mt-1 text-xs text-bahaya">{error}</p>}
    </div>
  );
}
