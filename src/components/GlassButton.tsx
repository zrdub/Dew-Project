import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type GlassButtonProps = {
  children: ReactNode
  className?: string
  icon?: ReactNode
  to?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

export default function GlassButton({
  children,
  className = '',
  icon,
  to,
  type = 'button',
  ...buttonProps
}: GlassButtonProps) {
  const content = (
    <>
      <span className="glass-button__label">{children}</span>
      {icon && <span className="glass-button__icon" aria-hidden="true">{icon}</span>}
    </>
  )

  if (to) {
    return (
      <Link className={`glass-button ${className}`} to={to}>
        {content}
      </Link>
    )
  }

  return (
    <button className={`glass-button ${className}`} type={type} {...buttonProps}>
      {content}
    </button>
  )
}
