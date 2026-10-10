import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { WizardHeader } from '../components/layout/WizardHeader'
import { useApp } from '../lib/AppContext'
import { formatNumber } from '../lib/utils'

// Counts up fast then slams to final number with a subtle overshoot
function DramaticCounter({
  target,
  onComplete,
}: {
  target: number
  onComplete?: () => void
}) {
  const [value, setValue] = useState(0)
  const [phase, setPhase] = useState<'counting' | 'done'>('counting')
  const called = useRef(false)

  useEffect(() => {
    // Phase 1: count up rapidly past target
    const overshoot = target + Math.ceil(target * 0.07)
    const phase1Dur = 1400
    const start1 = Date.now()
    let raf: number

    const tick1 = () => {
      const p = Math.min((Date.now() - start1) / phase1Dur, 1)
      const eased = 1 - Math.pow(1 - p, 2)   // ease-out quad
      setValue(Math.floor(eased * overshoot))
      if (p < 1) {
        raf = requestAnimationFrame(tick1)
      } else {
        // Phase 2: pull back to exact target
        setValue(overshoot)
        setTimeout(() => {
          const phase2Dur = 500
          const start2 = Date.now()
          const tick2 = () => {
            const p2 = Math.min((Date.now() - start2) / phase2Dur, 1)
            const eased2 = 1 - Math.pow(1 - p2, 3)
            setValue(Math.round(overshoot - (overshoot - target) * eased2))
            if (p2 < 1) requestAnimationFrame(tick2)
            else {
              setValue(target)
              setPhase('done')
              if (!called.current) { called.current = true; onComplete?.() }
            }
          }
          requestAnimationFrame(tick2)
        }, 80)
      }
    }
    raf = requestAnimationFrame(tick1)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return (
    <motion.span
      animate={phase === 'done' ? { color: ['#C97070', '#F4F1EA', '#C97070'] } : {}}
      transition={{ duration: 1.5, repeat: 0 }}
    >
      {formatNumber(value)}
    </motion.span>
  )
}

export function UnexplainedPage() {
  const { verificationResult, setStep, setSelectedEvidenceId, setEvidenceIndex } = useApp()
  const [showBody, setShowBody] = useState(false)
  const [showCards, setShowCards] = useState(false)

  if (!verificationResult) return null
  const { summary, evidence, highlighted_ids } = verificationResult
  const missingEvidence = evidence.filter(e => e.kind === 'missing_id')

  const handleViewRecord = (evidenceId: string, index: number) => {
    setSelectedEvidenceId(evidenceId)
    setEvidenceIndex(index)
    setStep('evidence')
  }

  return (
    <div className="min-h-screen bg-void">
      <WizardHeader />

      <div className="pt-24 pb-16 px-8 lg:px-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Left: dramatic statement */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <div className="font-mono text-micro text-attention-text uppercase tracking-widest">
                REQUIRES ATTENTION
              </div>
            </motion.div>

            {/* Giant counter — the money number */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="font-serif text-bone leading-none mb-0"
                style={{ fontSize: 'clamp(4rem,10vw,8rem)' }}
              >
                <DramaticCounter
                  target={summary.unexplained_losses}
                  onComplete={() => { setShowBody(true); setTimeout(() => setShowCards(true), 300) }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={showBody ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-serif text-hero-sm text-bone leading-tight mt-2">
                records have
                <br />
                no valid fate.
              </h2>
              <p className="mt-6 font-sans text-body text-muted leading-relaxed max-w-sm">
                These records existed in the original file but do not appear
                in the transformed file, and they are not part of a valid
                duplicate removal.
              </p>

              <div className="mt-10 flex flex-col gap-3">
                <button
                  onClick={() => handleViewRecord(missingEvidence[0]?.id, 0)}
                  className="flex items-center gap-2 border border-failed/60 text-failed-text font-sans text-body-sm px-6 py-3 hover:bg-failed-dim transition-colors w-fit"
                >
                  View all {formatNumber(summary.unexplained_losses)} records →
                </button>
                <button
                  onClick={() => setStep('results')}
                  className="font-sans text-label text-dim hover:text-muted transition-colors w-fit"
                >
                  ← Back to results
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right: stacked evidence cards */}
          <div className="relative hidden lg:block">
            <div className="relative h-80 mt-8">
              {highlighted_ids.slice(0, 5).map((entityId, i) => {
                const ev = evidence.find(e => e.entity_key === entityId)
                if (!ev) return null
                return (
                  <motion.div
                    key={entityId}
                    initial={{ opacity: 0, x: 40, rotate: i * 3 - 4 }}
                    animate={showCards ? {
                      opacity: 1,
                      x: i * 14,
                      y: i * 10,
                      rotate: i * 2 - 2,
                    } : {}}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    style={{ position: 'absolute', top: i * 4, right: i * 8 }}
                    className="w-56 bg-surface border border-failed/40 p-4 cursor-pointer hover:border-failed/80 transition-colors"
                    onClick={() => handleViewRecord(ev.id, i)}
                  >
                    <div className="font-mono text-body-sm text-bone mb-2">{entityId}</div>
                    <div className="font-mono text-micro text-failed-text uppercase tracking-widest mb-3">
                      UNEXPLAINED LOSS
                    </div>
                    <div className="font-sans text-label text-muted">{ev.before_row?.name ?? 'Unknown'}</div>
                    <div className="mt-3 font-mono text-micro text-dim border-t border-ghost pt-2">
                      NOT FOUND IN OUTPUT
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mini list */}
        {showBody && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <div className="font-mono text-micro text-dim uppercase tracking-widest mb-4">
              MISSING RECORDS — FIRST {Math.min(10, missingEvidence.length)} OF {formatNumber(summary.unexplained_losses)}
            </div>
            <div className="space-y-0">
              {missingEvidence.slice(0, 10).map((ev, i) => (
                <button
                  key={ev.id}
                  onClick={() => handleViewRecord(ev.id, i)}
                  className="w-full flex items-center gap-4 py-2.5 px-3 border-b border-ghost/30 hover:border-ghost hover:bg-surface/50 transition-all text-left group"
                >
                  <div className="font-mono text-body-sm text-bone w-24 shrink-0">{ev.entity_key}</div>
                  <div className="font-sans text-body-sm text-muted flex-1">{ev.before_row?.name ?? '—'}</div>
                  <div className="font-mono text-micro text-failed-text uppercase tracking-widest shrink-0">UNEXPLAINED LOSS</div>
                  <div className="text-dim opacity-0 group-hover:opacity-100 transition-opacity text-label">→</div>
                </button>
              ))}
            </div>
            {missingEvidence.length > 10 && (
              <div className="mt-4 font-sans text-label text-dim">
                + {formatNumber(summary.unexplained_losses - 10)} more unexplained records
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
