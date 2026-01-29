import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import GalaxyCanvas from '../components/galaxy/GalaxyCanvas'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { Sparkles, ArrowLeft, X, ExternalLink } from 'lucide-react'

export default function PublicGalaxy() {
  const { userId } = useParams()
  const api = useApi()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedIdea, setSelectedIdea] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        const data = await api.getPublicProfile(userId)
        setProfile(data)
      } catch (err) {
        setError(err.message || 'Failed to load galaxy')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  if (loading) {
    return (
      <div className="h-screen w-screen bg-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Discovering galaxy...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-void flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-red-500/50" />
          </div>
          <h2 className="font-display text-2xl font-light mb-3">
            Galaxy not found
          </h2>
          <p className="text-zinc-500 mb-6">
            {error}
          </p>
          <Link to="/">
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-void overflow-hidden relative">
      {/* Galaxy Canvas (read-only) */}
      <GalaxyCanvas
        ideas={profile.ideas}
        constellations={profile.constellations}
        onStarClick={setSelectedIdea}
        readOnly={true}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center glow-orange">
                <Sparkles className="w-5 h-5 text-accent-primary" />
              </div>
              <span className="font-display font-semibold text-lg tracking-tight hidden md:block">
                Galaxy Ideas
              </span>
            </div>
          </Link>

          <div className="glass rounded-full px-4 py-2">
            <span className="text-sm text-zinc-400">
              <span className="text-accent-primary font-medium">{profile.user_name}'s</span> Galaxy
              <span className="hidden sm:inline text-zinc-600 ml-2">
                ({profile.ideas.length} {profile.ideas.length === 1 ? 'star' : 'stars'})
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* CTA Banner */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
        <Link to="/signup">
          <div className="glass rounded-full px-6 py-3 flex items-center gap-3 hover:border-accent-primary/50 transition-colors cursor-pointer">
            <Sparkles className="w-5 h-5 text-accent-primary" />
            <span className="text-sm text-zinc-300">Create your own galaxy</span>
            <ExternalLink className="w-4 h-4 text-zinc-500" />
          </div>
        </Link>
      </div>

      {/* Empty State */}
      {profile.ideas.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-md px-8">
            <div className="w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-accent-primary/50" />
            </div>
            <h2 className="font-display text-2xl font-light mb-3">
              This galaxy is still forming
            </h2>
            <p className="text-zinc-500">
              {profile.user_name} hasn't published any completed ideas yet.
            </p>
          </div>
        </div>
      )}

      {/* Idea Detail Modal (Read-only) */}
      {selectedIdea && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIdea(null)}
        >
          <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-lg glass rounded-2xl p-6 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedIdea(null)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: selectedIdea.status === 'completed' ? '#00E5FF' :
                      selectedIdea.status === 'refined' ? '#FF6B00' :
                      selectedIdea.status === 'developing' ? '#FFD700' : '#FFFFFF',
                    boxShadow: `0 0 10px ${
                      selectedIdea.status === 'completed' ? 'rgba(0, 229, 255, 0.5)' :
                      selectedIdea.status === 'refined' ? 'rgba(255, 107, 0, 0.5)' :
                      selectedIdea.status === 'developing' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'
                    }`
                  }}
                />
                <h2 className="font-display font-semibold text-xl">
                  {selectedIdea.title}
                </h2>
              </div>
              <StatusBadge status={selectedIdea.status} />
            </div>

            {selectedIdea.description && (
              <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {selectedIdea.description}
              </p>
            )}

            {!selectedIdea.description && (
              <p className="text-zinc-600 italic">
                No description provided.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
