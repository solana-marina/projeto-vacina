import React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '../../lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#0B5D7A] text-white hover:bg-[#094b62] shadow-sm',
      secondary: 'bg-[#2A9D8F] text-white hover:bg-[#238b7e] shadow-sm',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
      ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      danger: 'bg-[#E76F51] text-white hover:bg-[#d65f41] shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10 p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5D7A] disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, label, error, ...props }, ref) => (
  <div className="w-full space-y-1.5">
    {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5D7A]',
        error ? 'border-red-500 focus-visible:ring-red-500' : '',
        className,
      )}
      {...props}
    />
    {error ? <span className="text-xs text-red-500">{error}</span> : null}
  </div>
));
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
}

export function Select({ label, className, children, ...props }: SelectProps) {
  return (
    <div className="w-full space-y-1.5">
      {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
      <select
        className={cn(
          'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5D7A]',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="w-full space-y-1.5">
      {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
      <textarea
        className={cn(
          'flex min-h-[90px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5D7A]',
          className,
        )}
        {...props}
      />
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  EM_DIA: 'bg-[#2A9D8F]/15 text-[#2A9D8F] border-[#2A9D8F]/20',
  ATRASADO: 'bg-[#E76F51]/15 text-[#E76F51] border-[#E76F51]/20',
  INCOMPLETO: 'bg-[#F4A261]/15 text-[#F4A261] border-[#F4A261]/20',
  SEM_DADOS: 'bg-gray-100 text-gray-600 border-gray-200',
  PENDENTE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ATRASADA: 'bg-[#E76F51]/15 text-[#E76F51] border-[#E76F51]/20',
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-red-100 text-red-700 border-red-200',
};

const BADGE_LABELS: Record<string, string> = {
  EM_DIA: 'EM DIA',
  ATRASADO: 'ATRASADO',
  INCOMPLETO: 'PENDENTE',
  SEM_DADOS: 'SEM DADOS',
  PENDENTE: 'PENDENTE',
  ATRASADA: 'ATRASADA',
  ACTIVE: 'ATIVO',
  INACTIVE: 'INATIVO',
};

export function Badge({ status, className }: { status: string; className?: string }) {
  const normalized = status.toUpperCase().replace(' ', '_');
  const style = BADGE_STYLES[normalized] ?? BADGE_STYLES.SEM_DADOS;
  const label = BADGE_LABELS[normalized] ?? status.replace(/_/g, ' ');
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', style, className)}>
      {label}
    </span>
  );
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-100 bg-white text-gray-900 shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn('font-semibold text-lg font-poppins text-[#0B5D7A]', className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>;
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative w-full overflow-auto rounded-lg border border-gray-200">
      <table className={cn('w-full caption-bottom text-sm', className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="border-b bg-gray-50/80">{children}</thead>;
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn('border-b transition-colors hover:bg-gray-50/60', onClick ? 'cursor-pointer' : '', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('h-10 px-4 text-left align-middle font-semibold text-gray-600 font-poppins text-xs uppercase', className)}>
      {children}
    </th>
  );
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('p-4 align-middle', className)}>{children}</td>;
}
