const statusConfig = {
  spark: {
    label: 'Spark',
    color: 'bg-white/20 text-white border-white/30'
  },
  developing: {
    label: 'Developing',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  },
  refined: {
    label: 'Refined',
    color: 'bg-accent-primary/20 text-accent-primary border-accent-primary/30'
  },
  completed: {
    label: 'Completed',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  },
  archived: {
    label: 'Archived',
    color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.spark

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}

export const STATUS_OPTIONS = [
  { value: 'spark', label: 'Spark' },
  { value: 'developing', label: 'Developing' },
  { value: 'refined', label: 'Refined' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
]
