import { forwardRef } from 'react'

const Input = forwardRef(function Input({
  label,
  error,
  className = '',
  ...props
}, ref) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-4 py-3
          bg-surface/50 border border-zinc-800
          rounded-lg text-white placeholder-zinc-600
          transition-all duration-300
          hover:border-zinc-700
          focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
})

export default Input

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3
          bg-surface/50 border border-zinc-800
          rounded-lg text-white placeholder-zinc-600
          transition-all duration-300
          hover:border-zinc-700
          focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
          resize-none
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

export function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3
          bg-surface/50 border border-zinc-800
          rounded-lg text-white
          transition-all duration-300
          hover:border-zinc-700
          focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
          cursor-pointer
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-surface">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
