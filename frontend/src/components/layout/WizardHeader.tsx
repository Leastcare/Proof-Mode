import { useApp } from '../../lib/AppContext'
import { StepIndicator } from './StepIndicator'

interface WizardHeaderProps {
  showSteps?: boolean
  onClose?: () => void
}

export function WizardHeader({ showSteps = true, onClose }: WizardHeaderProps) {
  const { reset } = useApp()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-ghost/40">
      <button
        onClick={reset}
        className="font-sans text-label font-medium text-bone tracking-widest uppercase hover:text-soft-white transition-colors"
      >
        ProofMode
      </button>

      {showSteps && <StepIndicator />}

      <button
        onClick={onClose ?? reset}
        className="text-label text-muted hover:text-bone transition-colors uppercase tracking-wider"
      >
        Close
      </button>
    </header>
  )
}
