import type { HTMLAttributes, ReactNode } from 'react'

type LiquidGlassCardProps = {
  children: ReactNode
} & HTMLAttributes<HTMLDivElement>

export default function LiquidGlassCard({
  children,
  className = '',
  ...props
}: LiquidGlassCardProps) {
  return (
    <div className={`liquid-card ${className}`} {...props}>
      {children}
    </div>
  )
}
