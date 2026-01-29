import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Link2, Unlink } from 'lucide-react'
import Button from '../ui/Button'
import Input, { Textarea, Select } from '../ui/Input'
import StatusBadge, { STATUS_OPTIONS } from '../ui/StatusBadge'

export default function IdeaModal({
  idea,
  onClose,
  onSave,
  onDelete,
  constellations = [],
  allIdeas = [],
  onUnlink
}) {
  const isEditing = !!idea
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'spark'
  })
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    if (idea) {
      setFormData({
        title: idea.title || '',
        description: idea.description || '',
        status: idea.status || 'spark'
      })
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'spark'
      })
    }
  }, [idea])

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.title.trim()) return

    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    setLoading(true)
    try {
      await onDelete(idea.id)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  // Get linked ideas for this idea
  const linkedConstellations = constellations.filter(
    c => c.idea_id_1 === idea?.id || c.idea_id_2 === idea?.id
  )

  const getLinkedIdea = useCallback((constellation) => {
    const linkedId = constellation.idea_id_1 === idea?.id
      ? constellation.idea_id_2
      : constellation.idea_id_1
    return allIdeas.find(i => i.id === linkedId)
  }, [idea, allIdeas])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg glass rounded-2xl p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="font-display font-semibold text-xl">
            {isEditing ? 'Edit Idea' : 'New Idea'}
          </h2>
          {isEditing && (
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={idea.status} />
              <span className="text-sm text-zinc-500">
                Created {new Date(idea.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Title"
            name="title"
            placeholder="What's your idea?"
            value={formData.title}
            onChange={handleChange}
            autoFocus
            data-testid="idea-title"
          />

          <Textarea
            label="Description"
            name="description"
            placeholder="Describe your idea in detail..."
            value={formData.description}
            onChange={handleChange}
            rows={4}
            data-testid="idea-description"
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={STATUS_OPTIONS}
            data-testid="idea-status"
          />

          {/* Linked Ideas Section */}
          {isEditing && linkedConstellations.length > 0 && (
            <div className="pt-4 border-t border-zinc-800">
              <label className="block text-sm font-medium text-zinc-400 mb-3">
                <Link2 className="w-4 h-4 inline mr-2" />
                Connected Ideas ({linkedConstellations.length})
              </label>
              <div className="space-y-2">
                {linkedConstellations.map(constellation => {
                  const linkedIdea = getLinkedIdea(constellation)
                  if (!linkedIdea) return null
                  return (
                    <div
                      key={constellation.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: linkedIdea.status === 'completed' ? '#00E5FF' :
                              linkedIdea.status === 'refined' ? '#FF6B00' :
                              linkedIdea.status === 'developing' ? '#FFD700' : '#FFFFFF'
                          }}
                        />
                        <span className="text-sm text-zinc-300">{linkedIdea.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUnlink?.(constellation.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                        title="Unlink"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            {isEditing ? (
              <Button
                type="button"
                variant={deleteConfirm ? 'danger' : 'ghost'}
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                {deleteConfirm ? 'Confirm Delete' : 'Delete'}
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!formData.title.trim()}
                data-testid="idea-submit"
              >
                {isEditing ? 'Save Changes' : 'Create Star'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
