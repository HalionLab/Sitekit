import Link from 'next/link';
import { ComponentProps } from 'react';

type Variant = 'primary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<ComponentProps<typeof Link>, 'className'> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-contrast hover:brightness-105',
  ghost: 'bg-transparent text-fg border border-fg/20 hover:bg-surface-inverse/5',
};
const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export function CTAButton({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  return (
    <Link
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
