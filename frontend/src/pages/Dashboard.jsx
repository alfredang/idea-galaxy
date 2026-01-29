import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGalaxy } from '../hooks/useGalaxy'
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
  X
} from 'lucide-react'
import { toast } from 'sonner'

export default function Dashboard() {
  const { user, logout } = useAuth()
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

  return (
    <div className="h-screen w-screen bg-void overflow-hidden relative">
      {/* Galaxy Canvas */}
      <GalaxyCanvas
        ideas={ideas}
        constellations={constellations}
        onStarClick={handleStarClick}
        onStarDragEnd={updateIdeaPosition}
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
