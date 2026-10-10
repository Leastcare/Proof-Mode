import { useApp } from '../../lib/AppContext'

export function SiteHeader() {
  const { reset } = useApp()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
      <button
        onClick={reset}
        className="font-sans text-label font-medium text-bone tracking-widest uppercase hover:text-soft-white transition-colors"
      >
        ProofMode
      </button>
      <nav className="flex items-center gap-6">
        <a href="#" className="text-label text-muted hover:text-soft-white transition-colors uppercase tracking-wider">
          About
        </a>
        <button
          onClick={reset}
          className="text-label text-bone border border-ghost hover:border-muted px-4 py-2 transition-colors uppercase tracking-wider"
        >
          Get Started
        </button>
      </nav>
    </header>
  )
}
