import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { WizardHeader } from '../components/layout/WizardHeader'
import { useApp } from '../lib/AppContext'
import { verifyFiles } from '../lib/api'
import { cn } from '../lib/utils'

const STEPS = [
  { id: 1, label: 'Reading files',        duration: 500 },
  { id: 2, label: 'Parsing records',      duration: 700 },
  { id: 3, label: 'Matching entities',    duration: 600 },
  { id: 4, label: 'Checking duplicates',  duration: 500 },
  { id: 5, label: 'Validating columns',   duration: 400 },
  { id: 6, label: 'Tracing differences',  duration: 800 },
]

// ── ECG heartbeat SVG ────────────────────────────────────────────────────────
// Draws a continuous ECG-like pulse path that sweeps from left to right.
function EcgLine() {
  // One full ECG beat as a relative SVG path segment
  const BEAT = 'l6,0 l2,-8 l3,18 l3,-22 l3,14 l2,-8 l6,0'
  const FLAT = 'l18,0'
  // Repeat across 400 wide viewBox
  const path = `M0,25 ${FLAT} ${BEAT} ${FLAT} ${BEAT} ${FLAT} ${BEAT} ${FLAT} ${BEAT} ${FLAT}`

  return (
    <div className="relative w-full max-w-lg mx-auto overflow-hidden h-16 mt-8">
      <svg
        viewBox="0 0 400 50"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Static dim trace */}
        <path d={path} fill="none" stroke="#3A3835" strokeWidth="1" />

        {/* Animated bright sweep */}
        <motion.path
          d={path}
          fill="none"
          stroke="#F4F1EA"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0.6 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 0.4,
          }}
        />

        {/* Fading tail */}
        <motion.path
          d={path}
          fill="none"
          stroke="#8B8983"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 0.4, 0.8], opacity: [0, 0.4, 0] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'linear',
            delay: 0.15,
            repeatDelay: 0.4,
          }}
        />
      </svg>
    </div>
  )
}

// ── Record stream visual ────────────────────────────────────────────────────
// Dots stream from left grid → flow channel → right grid
function RecordStream({ progress }: { progress: number }) {
  const COLS = 10
  const ROWS = 10
  const total = COLS * ROWS
  const filled = Math.floor(progress * total)
  const outFilled = Math.floor(progress * total * 0.9863)

  return (
    <div className="flex items-center gap-6 my-6 justify-center">
      {/* Before grid */}
      <div className="shrink-0">
        <div className="font-mono text-micro text-dim uppercase tracking-widest mb-2 text-center">ORIGINAL</div>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: total }).map((_, i) => (
            <motion.div
              key={i}
              className={cn('w-2 h-2 rounded-sm transition-colors duration-300',
                i < filled ? 'bg-verified/60' : 'bg-ghost')}
            />
          ))}
        </div>
        <div className="mt-2 font-mono text-title text-bone text-center">10,000</div>
        <div className="font-sans text-label text-dim text-center">Processing...</div>
      </div>

      {/* Flow channel — animated wave dots */}
      <div className="flex items-center gap-1 shrink-0">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted/40"
            animate={{ opacity: [0.1, 0.8, 0.1], x: [0, 6, 0] }}
            transition={{ duration: 1.2, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* After grid */}
      <div className="shrink-0">
        <div className="font-mono text-micro text-dim uppercase tracking-widest mb-2 text-center">OUTPUT</div>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: total }).map((_, i) => (
            <motion.div
              key={i}
              className={cn('w-2 h-2 rounded-sm transition-colors duration-500',
                i < outFilled ? 'bg-muted/50' : 'bg-ghost/30')}
            />
          ))}
        </div>
        <div className="mt-2 font-mono text-title text-bone text-center">9,863</div>
        <div className="font-sans text-label text-dim text-center">Reconciled so far</div>
      </div>
    </div>
  )
}

// ── Animated counter ────────────────────────────────────────────────────────
function Counter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
      else setV(target)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return <>{v.toLocaleString()}</>
}

export function VerifyProgressPage() {
  const {
    originalFile, transformedFile, contract,
    setVerificationResult, setStep, isDemoMode,
  } = useApp()

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!originalFile || !transformedFile || !contract) return

    // Animate checklist
    let idx = 0
    const advance = () => {
      if (idx < STEPS.length) {
        setCurrentStep(idx)
        setProgress((idx + 1) / STEPS.length)
        idx++
        setTimeout(advance, STEPS[idx - 1]?.duration ?? 500)
      }
    }
    advance()

    if (isDemoMode) {
      import('../lib/mockData').then(({ MOCK_VERIFICATION_FAILED }) => {
        setTimeout(() => {
          setVerificationResult(MOCK_VERIFICATION_FAILED)
          setStep('results')
        }, 3600)
      })
      return
    }

    verifyFiles(originalFile, transformedFile, contract)
      .then(result => {
        setVerificationResult(result)
        setTimeout(() => setStep('results'), 400)
      })
      .catch(err => {
        setError(err?.message ?? 'Verification failed. Is the backend running?')
      })
  }, [])

  return (
    <div className="min-h-screen bg-void">
      <WizardHeader />

      <div className="pt-24 pb-16 px-8 lg:px-16 max-w-3xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h2 className="font-serif text-hero-sm text-bone">Checking every record</h2>
          <p className="mt-4 font-sans text-body text-muted">
            Comparing original and transformed data against{' '}
            {contract?.clauses.length ?? 0} requirements...
          </p>
        </motion.div>

        {/* ECG heartbeat */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <EcgLine />
        </motion.div>

        {/* Record stream */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <RecordStream progress={progress} />
        </motion.div>

        {/* Steps checklist */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-1 max-w-xs mx-auto"
        >
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={cn(
                'w-4 h-4 flex items-center justify-center font-mono text-micro transition-all',
                i < currentStep && 'text-verified-text',
                i === currentStep && 'text-bone animate-pulse',
                i > currentStep && 'text-ghost'
              )}>
                {i < currentStep ? '✓' : i === currentStep ? '·' : '○'}
              </div>
              <span className={cn(
                'font-sans text-label transition-colors',
                i < currentStep && 'text-muted',
                i === currentStep && 'text-bone',
                i > currentStep && 'text-ghost'
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 max-w-sm mx-auto">
          <div className="h-px bg-ghost relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-bone"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </motion.div>

        {/* Error state */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 max-w-lg mx-auto">
            <div className="border border-failed/40 bg-failed-dim px-5 py-4 text-center">
              <div className="font-mono text-label text-failed-text uppercase tracking-widest mb-2">VERIFICATION ERROR</div>
              <p className="font-sans text-body-sm text-muted mb-4">{error}</p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setStep('upload')} className="font-sans text-label text-muted hover:text-bone transition-colors border border-ghost px-4 py-2">
                  ← Back to upload
                </button>
                <button
                  onClick={() => {
                    import('../lib/mockData').then(({ MOCK_VERIFICATION_FAILED }) => {
                      setVerificationResult(MOCK_VERIFICATION_FAILED)
                      setStep('results')
                    })
                  }}
                  className="font-sans text-label text-bone border border-muted px-4 py-2 hover:bg-surface transition-colors"
                >
                  Use demo result →
                </button>
              </div>
              <p className="mt-3 font-mono text-micro text-dim">
                Start backend: cd backend &amp;&amp; uvicorn app.main:app --reload
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
