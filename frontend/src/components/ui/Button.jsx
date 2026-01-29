import { forwardRef } from 'react'

const variants = {
  primary: 'bg-accent-primary hover:bg-accent-secondary text-void font-medium',
  secondary: 'bg-transparent border border-accent-primary/50 hover:border-accent-primary text-accent-primary hover:text-accent-secondary',
  ghost: 'bg-transparent hover:bg-white/5 text-zinc-300 hover:text-white',
  danger: 'bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-400 hover:text-red-300'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base'
}

const Button = forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center gap-2
        rounded-full font-body
        transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-void
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  )
})

export default Button
