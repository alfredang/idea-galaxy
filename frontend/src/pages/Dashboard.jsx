import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGalaxy } from '../hooks/useGalaxy'
import { useApi } from '../hooks/useApi'
import GalaxyCanvas from '../components/galaxy/GalaxyCanvas'
import IdeaModal from '../components/modals/IdeaModal'
import Button from '../components/ui/Button'
import {
  Plus,
  Link2,
  LogOut,
  Share2,
  Sparkles,
  RefreshCw,
  Menu,
  X,
  Compass,
  ExternalLink,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const api = useApi()
  const {
    ideas,
    constellations,
    loading,
    selectedIdea,
    setSelectedIdea,
    linkMode,
    linkSource,
    toggleLinkMode,
    addIdea,
    updateIdea,
    removeIdea,
    updateIdeaPosition,
    unlinkIdeas,
    handleStarClick,
    refresh
  } = useGalaxy()

  const [showNewModal, setShowNewModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showDiscover, setShowDiscover] = useState(false)
  const [discoverIdeas, setDiscoverIdeas] = useState([])
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [hoveredIdea, setHoveredIdea] = useState(null)
  const [relatedIdeas, setRelatedIdeas] = useState([])
  const [relatedLoading, setRelatedLoading] = useState(false)

  // Fetch related ideas when hovering over a star
  const handleStarHover = useCallback(async (idea) => {
    setHoveredIdea(idea)
    if (idea) {
      setRelatedLoading(true)
      try {
        const related = await api.getRelatedIdeas(idea.id)
        setRelatedIdeas(related)
      } catch (err) {
        console.error('Failed to get related ideas:', err)
        setRelatedIdeas([])
      } finally {
        setRelatedLoading(false)
      }
    } else {
      setRelatedIdeas([])
    }
  }, [api])

  // Fetch discover ideas
  async function loadDiscoverIdeas() {
    setDiscoverLoading(true)
    try {
      const ideas = await api.discoverIdeas()
      setDiscoverIdeas(ideas)
    } catch (err) {
      console.error('Failed to discover ideas:', err)
      toast.error('Failed to load discoveries')
    } finally {
      setDiscoverLoading(false)
    }
  }

  function handleShare() {
    const shareUrl = `${window.location.origin}/galaxy/${user.id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Share link copied to clipboard!')
  }

  async function handleSaveIdea(data) {
    if (selectedIdea) {
      await updateIdea(selectedIdea.id, data)
    } else {
      await addIdea(data)
    }
  }

  function handleCloseModal() {
    setSelectedIdea(null)
    setShowNewModal(false)
  }

  function toggleDiscover() {
    setShowDiscover(!showDiscover)
    if (!showDiscover && discoverIdeas.length === 0) {
      loadDiscoverIdeas()
    }
  }

  return (
    <div className="h-screen w-screen bg-void overflow-hidden relative">
      {/* Galaxy Canvas */}
      <GalaxyCanvas
        ideas={ideas}
        constellations={constellations}
        onStarClick={handleStarClick}
        onStarDragEnd={updateIdeaPosition}
        onStarHover={handleStarHover}
        linkMode={linkMode}
        linkSource={linkSource}
      />

      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center glow-orange">
              <Sparkles className="w-5 h-5 text-accent-primary" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight hidden md:block">
              Galaxy Ideas
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4">
            <div className="text-sm text-zinc-500">
              <span className="text-zinc-400">{ideas.length}</span> stars in your galaxy
            </div>

            <div className="h-6 w-px bg-zinc-800" />

            <Button
              variant={showDiscover ? 'primary' : 'ghost'}
              size="sm"
              onClick={toggleDiscover}
              title="Discover ideas from others"
            >
              <Compass className="w-4 h-4" />
              <span className="hidden lg:inline">Discover</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              title="Share Galaxy"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-zinc-800" />

            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">{user?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 glass border-t border-zinc-800 p-4">
            <div className="space-y-3">
              <div className="text-sm text-zinc-500">
                <span className="text-zinc-400">{ideas.length}</span> stars in your galaxy
              </div>
              <button
                onClick={() => { toggleDiscover(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-zinc-300"
              >
                <Compass className="w-5 h-5" />
                Discover Ideas
              </button>
              <button
                onClick={() => { handleShare(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-zinc-300"
              >
                <Share2 className="w-5 h-5" />
                Share Galaxy
              </button>
              <button
                onClick={() => { refresh(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-zinc-300"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                <span className="text-zinc-400">{user?.name}</span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Related Ideas Panel (shows on hover) */}
      {hoveredIdea && relatedIdeas.length > 0 && (
        <div className="absolute top-20 right-4 z-30 w-80 glass rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent-primary" />
            <h3 className="text-sm font-medium text-zinc-300">
              Similar ideas from others
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {relatedLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              relatedIdeas.slice(0, 5).map(idea => (
                <Link
                  key={idea.id}
                  to={`/galaxy/${idea.user_id}`}
                  className="block p-3 rounded-lg bg-surface/50 hover:bg-surface border border-zinc-800 hover:border-accent-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{idea.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">by {idea.user_name}</p>
                    </div>
                    <span className="text-xs text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full">
                      {Math.round(idea.similarity * 100)}%
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Discover Panel */}
      {showDiscover && (
        <div className="absolute top-20 left-4 z-30 w-80 glass rounded-xl p-4 animate-fade-in max-h-[70vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-accent-primary" />
              <h3 className="font-medium text-zinc-200">Discover Ideas</h3>
            </div>
            <button
              onClick={() => setShowDiscover(false)}
              className="p-1 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            AI-matched ideas from other galaxies based on your interests
          </p>
          <div className="space-y-2 overflow-y-auto flex-1">
            {discoverLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : discoverIdeas.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">
                No discoveries yet. Add more ideas to get personalized recommendations!
              </p>
            ) : (
              discoverIdeas.map(idea => (
                <Link
                  key={idea.id}
                  to={`/galaxy/${idea.user_id}`}
                  className="block p-3 rounded-lg bg-surface/50 hover:bg-surface border border-zinc-800 hover:border-accent-primary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{idea.title}</p>
                      {idea.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{idea.description}</p>
                      )}
                      <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1">
                        <span>by {idea.user_name}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </div>
                    <span className="text-xs text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full shrink-0">
                      {Math.round(idea.similarity * 100)}%
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
          <button
            onClick={loadDiscoverIdeas}
            className="mt-4 w-full py-2 text-sm text-accent-primary hover:text-accent-secondary transition-colors"
          >
            Refresh discoveries
          </button>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-3 p-2 glass rounded-full">
          <Button
            variant={linkMode ? 'primary' : 'secondary'}
            size="md"
            onClick={toggleLinkMode}
            className="rounded-full"
            title={linkMode ? 'Cancel linking' : 'Link ideas'}
          >
            <Link2 className="w-5 h-5" />
            <span className="hidden sm:inline">
              {linkMode ? 'Cancel' : 'Link'}
            </span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowNewModal(true)}
            className="rounded-full glow-orange"
            data-testid="new-idea-button"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Idea</span>
          </Button>
        </div>

        {/* Link mode helper text */}
        {linkMode && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap">
            <p className="text-sm text-accent-primary animate-pulse">
              {linkSource
                ? 'Click another star to form a constellation'
                : 'Click a star to start linking'
              }
            </p>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 bg-void/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400">Loading your galaxy...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && ideas.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-md px-8">
            <div className="w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-accent-primary/50" />
            </div>
            <h2 className="font-display text-2xl font-light mb-3">
              Your galaxy awaits
            </h2>
            <p className="text-zinc-500 mb-6">
              Create your first idea and watch it become a star in your personal universe of creativity.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowNewModal(true)}
              className="pointer-events-auto glow-orange"
            >
              <Plus className="w-5 h-5" />
              Create Your First Star
            </Button>
          </div>
        </div>
      )}

      {/* Idea Modal */}
      {(selectedIdea || showNewModal) && (
        <IdeaModal
          idea={selectedIdea}
          onClose={handleCloseModal}
          onSave={handleSaveIdea}
          onDelete={removeIdea}
          constellations={constellations}
          allIdeas={ideas}
          onUnlink={unlinkIdeas}
        />
      )}
    </div>
  )
}
