import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        utama: 'bg-terracotta text-white hover:bg-terracotta/90',
        garis: 'border border-garis-kuat bg-permukaan text-tinta hover:bg-kertas',
        halus: 'text-tinta-lembut hover:bg-garis/50 hover:text-tinta',
        bahaya: 'border border-bahaya/30 bg-bahaya-lembut text-bahaya hover:bg-bahaya hover:text-white',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-5 text-base',
        ikon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'utama', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';

/** Link yang tampil sebagai tombol. Dipisah dari Button supaya tetap <a>. */
export function TautanTombol({
  href,
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
