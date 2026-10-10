import { useApp } from '../../lib/AppContext'
import type { FlowStep } from '../../types/verification'
import { cn } from '../../lib/utils'

const STEPS: { id: number; label: string; steps: FlowStep[] }[] = [
  { id: 1, label: 'Upload', steps: ['upload'] },
  { id: 2, label: 'Contract', steps: ['contract'] },
  { id: 3, label: 'Verify', steps: ['verifying', 'results', 'unexplained', 'evidence', 'repair'] },
  { id: 4, label: 'Review', steps: ['reverify', 'success'] },
]

function getActiveStep(currentStep: FlowStep): number {
  for (const s of STEPS) {
    if (s.steps.includes(currentStep)) return s.id
  }
  return 1
}

export function StepIndicator() {
  const { step } = useApp()
  const active = getActiveStep(step)

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const isActive = s.id === active
        const isDone = s.id < active

        return (
          <div key={s.id} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-micro font-mono transition-all',
                  isActive && 'bg-bone text-void',
                  isDone && 'bg-verified border border-verified text-verified-text',
                  !isActive && !isDone && 'border border-ghost text-dim'
                )}
              >
                {isDone ? '✓' : s.id}
              </div>
              <span className={cn(
                'text-label uppercase tracking-wider transition-colors hidden sm:block',
                isActive && 'text-bone',
                isDone && 'text-muted',
                !isActive && !isDone && 'text-dim'
              )}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'w-6 h-px mx-1 transition-colors',
                isDone ? 'bg-muted' : 'bg-ghost'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
