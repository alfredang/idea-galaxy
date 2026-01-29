import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Sparkles, ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-void/60 z-10" />
        <iframe
          src="https://www.youtube.com/embed/E0gxQK72nkk?autoplay=1&mute=1&loop=1&playlist=E0gxQK72nkk&controls=0&showinfo=0&modestbranding=1&start=60&playsinline=1"
          className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center glow-orange">
              <Sparkles className="w-5 h-5 text-accent-primary" />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight">Galaxy Ideas</span>
          </div>

          <nav className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="md">
                  Enter Galaxy
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="md">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="md">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-4xl text-center animate-scale-in">
            <h1 className="font-display font-light text-5xl md:text-7xl lg:text-8xl leading-tight tracking-tight mb-6">
              Your ideas are
              <span className="block font-semibold text-accent-primary glow-text">
                stars waiting
              </span>
              to be discovered
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Transform your thoughts into constellations. Watch your ideas glow, connect, and evolve in your own personal galaxy of creativity.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="primary" size="lg" className="glow-orange">
                    <Sparkles className="w-5 h-5" />
                    Explore Your Galaxy
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button variant="primary" size="lg" className="glow-orange">
                      <Sparkles className="w-5 h-5" />
                      Create Your Galaxy
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="lg">
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Footer tagline */}
        <footer className="px-8 py-6 text-center">
          <p className="text-zinc-600 text-sm">
            Every great discovery started as a spark
          </p>
        </footer>
      </div>

      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-secondary/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}
