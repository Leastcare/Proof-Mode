import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { WizardHeader } from '../components/layout/WizardHeader'
import { useApp } from '../lib/AppContext'

const VERDICT_CHECKS = [
  { key: 'present',      label: 'Present in original',        pass: true  },
  { key: 'absent',       label: 'Absent in transformed',      pass: false },
  { key: 'not_dupe',     label: 'Not a duplicate',            pass: false },
  { key: 'not_permit',   label: 'Not permitted by contract',  pass: false },
]

export function EvidencePage() {
  const {
    verificationResult,
    evidenceIndex,
    setEvidenceIndex,
    setSelectedEvidenceId,
    setStep,
  } = useApp()

  if (!verificationResult) return null

  const missingEvidence = verificationResult.evidence.filter(e => e.kind === 'missing_id')
  const total = missingEvidence.length
  const current = missingEvidence[evidenceIndex]

  const goNext = useCallback(() => {
    if (evidenceIndex < total - 1) {
      const next = evidenceIndex + 1
      setEvidenceIndex(next)
      setSelectedEvidenceId(missingEvidence[next].id)
    }
  }, [evidenceIndex, total])

  const goPrev = useCallback(() => {
    if (evidenceIndex > 0) {
      const prev = evidenceIndex - 1
      setEvidenceIndex(prev)
      setSelectedEvidenceId(missingEvidence[prev].id)
    }
  }, [evidenceIndex])

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goPrev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  if (!current) return null

  return (
    <div className="min-h-screen bg-void">
      <WizardHeader />

      <div className="pt-20 pb-16 px-8 lg:px-16 max-w-5xl mx-auto">

        {/* Navigation bar */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <button
            onClick={() => setStep('unexplained')}
            className="font-sans text-label text-muted hover:text-bone transition-colors flex items-center gap-2"
          >
            ← Back to list
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={evidenceIndex === 0}
              className="w-7 h-7 border border-ghost flex items-center justify-center text-muted hover:border-muted hover:text-bone disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono text-label"
              title="Previous (←)"
            >‹</button>
            <span className="font-mono text-label text-muted">
              {evidenceIndex + 1} / {total}
            </span>
            <button
              onClick={goNext}
              disabled={evidenceIndex >= total - 1}
              className="w-7 h-7 border border-ghost flex items-center justify-center text-muted hover:border-muted hover:text-bone disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono text-label"
              title="Next (→)"
            >›</button>
          </div>
          <div className="font-mono text-micro text-ghost hidden sm:block">
            ← → to navigate
          </div>
        </div>

        {/* Record */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Entity ID — hero */}
            <div className="font-mono leading-none text-bone mb-4"
              style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)' }}>
              {current.entity_key}
            </div>

            {/* Verdict badge */}
            <div className="inline-flex items-center gap-2 bg-failed-dim border border-failed/40 px-3 py-1.5 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-failed-text" />
              <span className="font-mono text-label text-failed-text uppercase tracking-widest">
                UNEXPLAINED LOSS
              </span>
            </div>

            {/* Checklist */}
            <div className="mb-10 space-y-2">
              {VERDICT_CHECKS.map((check, i) => (
                <motion.div
                  key={check.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-micro border ${
                    check.pass
                      ? 'border-verified bg-verified-dim text-verified-text'
                      : 'border-failed/60 bg-failed-dim text-failed-text'
                  }`}>
                    {check.pass ? '✓' : '✕'}
                  </div>
                  <span className="font-sans text-body-sm text-soft-white">{check.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Before / After — full width, different treatment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-ghost">
              {/* Before record */}
              <div className="p-6 border-b lg:border-b-0 lg:border-r border-ghost">
                <div className="font-mono text-micro text-dim uppercase tracking-widest mb-4">
                  ORIGINAL RECORD
                  <span className="ml-2 text-ghost text-micro">CSV (before)</span>
                </div>
                {current.before_row && Object.entries(current.before_row).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-2 gap-4 py-1.5 border-b border-ghost/20 last:border-0">
                    <div className="font-mono text-label text-dim">{key}</div>
                    <div className="font-mono text-label text-soft-white truncate">{String(val)}</div>
                  </div>
                ))}
              </div>

              {/* After — void panel */}
              <div className="relative overflow-hidden bg-void flex flex-col items-center justify-center min-h-[220px] p-6">
                {/* Subtle scan-line texture to emphasise absence */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(244,241,234,0.015) 3px,rgba(244,241,234,0.015) 4px)',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-ghost/30 to-transparent" />
                </div>

                <div className="relative z-10 text-center">
                  <div className="font-mono text-micro text-dim uppercase tracking-widest mb-2">
                    TRANSFORMED RECORD
                    <span className="ml-2 text-ghost">CSV (after)</span>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="font-mono text-title text-ghost/40 mt-6 mb-2"
                  >
                    ∅
                  </motion.div>
                  <div className="font-mono text-label text-dim/60">NOT FOUND</div>
                  <div className="font-mono text-micro text-ghost/40 mt-1">in transformed file</div>
                </div>
              </div>
            </div>

            {/* Proof note */}
            <div className="mt-6 p-4 border border-ghost/40 bg-surface/50">
              <div className="font-mono text-micro text-dim uppercase tracking-widest mb-2">PROOF</div>
              <p className="font-sans text-body-sm text-muted leading-relaxed">{current.explanation}</p>
            </div>

            {/* Actions */}
            <div className="mt-10 flex items-center gap-4 pt-6 border-t border-ghost">
              <button
                onClick={() => setStep('repair')}
                className="flex items-center gap-2 bg-bone text-void font-sans text-body-sm font-medium px-6 py-3 hover:bg-soft-white transition-colors"
              >
                Generate repair instruction →
              </button>
              <button
                onClick={() => setStep('unexplained')}
                className="font-sans text-label text-muted hover:text-bone transition-colors"
              >
                View all missing records
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
