import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { WizardHeader } from '../components/layout/WizardHeader'
import { useApp } from '../lib/AppContext'
import { cn, formatNumber, getStatusColor, getClauseLabel, getClauseIcon } from '../lib/utils'

// ── Animated number counter ────────────────────────────────────────────────────
function AnimatedNumber({ target, delay = 0 }: { target: number; delay?: number }) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  useEffect(() => {
    if (!started) return
    const dur = 1200
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
      else setValue(target)
    }
    requestAnimationFrame(tick)
  }, [started, target])
  return <>{formatNumber(value)}</>
}

// ── SVG lineage trace ─────────────────────────────────────────────────────────
// Shows ~40 sample record paths from before-grid to after-grid.
// Survived → solid line drawn through. Unexplained → line draws halfway then fades.
function LineageTrace({
  survived,
  total,
  unexplained,
}: {
  survived: number
  total: number
  unexplained: number
}) {
  const LINES = 40
  const survivedRatio = survived / total
  const unexplainedRatio = unexplained / total

  // Build line specs deterministically
  const lines = Array.from({ length: LINES }, (_, i) => {
    const norm = i / LINES
    const isUnexplained = norm > survivedRatio && norm <= survivedRatio + unexplainedRatio
    const isDupe = !isUnexplained && norm > survivedRatio
    const fromY = 20 + (i / LINES) * 60   // % of svg height
    const toY = isUnexplained ? fromY - 3 : fromY + (Math.sin(i * 0.8) * 4)
    return { fromY, toY, isUnexplained, isDupe, delay: i * 0.025 }
  })

  return (
    <svg
      viewBox="0 0 200 100"
      className="w-full max-w-xs opacity-40 pointer-events-none"
      preserveAspectRatio="none"
    >
      {lines.map((l, i) => (
        <motion.line
          key={i}
          x1="10" y1={l.fromY}
          x2={l.isUnexplained ? '100' : '190'}
          y2={l.toY}
          stroke={l.isUnexplained ? '#C97070' : l.isDupe ? '#55534E' : '#4A7C59'}
          strokeWidth="0.6"
          strokeOpacity={l.isUnexplained ? 0.6 : 0.4}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: l.isUnexplained ? [0, 0.7, 0] : 1 }}
          transition={{
            pathLength: { delay: 0.8 + l.delay, duration: l.isUnexplained ? 1.2 : 0.8, ease: 'easeOut' },
            opacity: { delay: 0.8 + l.delay, duration: l.isUnexplained ? 2 : 0.4 },
          }}
        />
      ))}
    </svg>
  )
}

// ── Dot matrix with separation ─────────────────────────────────────────────────
function RecordMatrix({
  total, survived, duplicates, unexplained,
}: {
  total: number; survived: number; duplicates: number; unexplained: number
}) {
  const COLS = 50
  const DOTS = 200 // representative dots
  const survivedDots = Math.floor((survived / total) * DOTS)
  const dupeDots = Math.floor((duplicates / total) * DOTS)
  const unexplainedDots = DOTS - survivedDots - dupeDots

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-[3px]">
        {/* Survived + dupe dots */}
        {Array.from({ length: survivedDots + dupeDots }).map((_, i) => {
          const isDupe = i >= survivedDots
          return (
            <motion.div
              key={`main-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.003, duration: 0.2 }}
              className={cn('w-1.5 h-1.5 rounded-sm', isDupe ? 'bg-dim/60' : 'bg-muted/50')}
            />
          )
        })}

        {/* Gap — visual separation before unexplained */}
        <div className="w-3" />

        {/* Unexplained dots — separated, red-tinted, staggered reveal */}
        {Array.from({ length: unexplainedDots }).map((_, i) => (
          <motion.div
            key={`loss-${i}`}
            initial={{ opacity: 0, scale: 0, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              delay: 0.8 + (survivedDots + dupeDots) * 0.003 + i * 0.015,
              duration: 0.3,
              type: 'spring',
              stiffness: 200,
            }}
            className="w-1.5 h-1.5 rounded-sm bg-failed/70"
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-muted/50" />
          <span className="font-sans text-label text-dim">Survived</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-dim/60" />
          <span className="font-sans text-label text-dim">Deduped</span>
        </div>
        <div className="flex items-center gap-2 ml-1">
          <div className="w-2 h-2 rounded-sm bg-failed/70" />
          <span className="font-sans text-label text-failed-text">Unexplained</span>
        </div>
      </div>
    </div>
  )
}

export function ResultsPage() {
  const { verificationResult, setStep } = useApp()
  const [showDetails, setShowDetails] = useState(false)
  const [showLineage, setShowLineage] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowDetails(true), 1200)
    const t2 = setTimeout(() => setShowLineage(true), 800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!verificationResult) return null
  const { summary, clause_results } = verificationResult

  return (
    <div className="min-h-screen bg-void">
      <WizardHeader />

      <div className="pt-24 pb-16 px-8 lg:px-16 max-w-5xl mx-auto">
        {/* Label */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="mb-8">
          <div className="font-mono text-micro text-muted uppercase tracking-widest">VERIFICATION COMPLETE</div>
        </motion.div>

        {/* Hero number */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-2"
        >
          <h2 className="font-serif leading-none text-bone" style={{ fontSize: 'clamp(3rem,7vw,6rem)' }}>
            <AnimatedNumber target={summary.after_row_count} /> records <em>remain.</em>
          </h2>
          <p className="mt-3 font-sans text-body text-muted">
            {formatNumber(summary.before_row_count - summary.after_row_count)} fewer than the original.
          </p>
        </motion.div>

        {/* Lineage trace + dot matrix side by side */}
        <div className="flex flex-col lg:flex-row items-start gap-8 mt-8">
          {showLineage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="lg:w-64 shrink-0">
              <div className="font-mono text-micro text-dim uppercase tracking-widest mb-2">RECORD LINEAGE</div>
              <LineageTrace
                survived={summary.surviving_rows}
                total={summary.before_row_count}
                unexplained={summary.unexplained_losses}
              />
              <div className="mt-2 font-sans text-label text-dim">
                Lines that fade = no valid fate
              </div>
            </motion.div>
          )}

          <div className="flex-1">
            <RecordMatrix
              total={summary.before_row_count}
              survived={summary.surviving_rows}
              duplicates={summary.explained_removals}
              unexplained={summary.unexplained_losses}
            />
          </div>
        </div>

        {/* Reconciliation breakdown */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { label: 'Original records', value: summary.before_row_count, color: 'text-bone', delay: 400 },
              { label: 'Records remain', value: summary.after_row_count, color: 'text-soft-white', delay: 500 },
              { label: 'Legitimate dupes', value: summary.explained_removals, color: 'text-muted', delay: 600 },
              {
                label: 'Unexplained losses',
                value: summary.unexplained_losses,
                color: summary.unexplained_losses > 0 ? 'text-failed-text' : 'text-verified-text',
                delay: 700,
              },
            ].map(({ label, value, color, delay }) => (
              <div key={label}>
                <div className={cn('font-mono leading-none', color)} style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
                  <AnimatedNumber target={value} delay={delay} />
                </div>
                <div className="mt-1 font-sans text-label text-muted">{label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Clause results */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12"
          >
            <div className="font-mono text-micro text-dim uppercase tracking-widest mb-4">CLAUSE RESULTS</div>
            <div className="space-y-0">
              {clause_results.map(result => (
                <div key={result.clause_id} className="flex items-center gap-4 py-3 border-b border-ghost/40">
                  <div className="font-mono text-body-sm text-dim w-5 text-center">{getClauseIcon(result.type)}</div>
                  <div className="flex-1">
                    <div className="font-mono text-label text-muted uppercase tracking-wider">{getClauseLabel(result.type)}</div>
                    <div className="font-sans text-label text-dim mt-0.5">{result.summary}</div>
                  </div>
                  <div className={cn('font-mono text-label uppercase tracking-widest shrink-0', getStatusColor(result.status))}>
                    {result.status}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        {showDetails && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-10">
            {summary.unexplained_losses > 0 ? (
              <button
                onClick={() => setStep('unexplained')}
                className="flex items-center gap-2 bg-failed text-bone font-sans text-body-sm font-medium px-8 py-3 hover:bg-failed/80 transition-colors"
              >
                Investigate {formatNumber(summary.unexplained_losses)} unexplained records →
              </button>
            ) : (
              <button
                onClick={() => setStep('success')}
                className="flex items-center gap-2 bg-verified text-bone font-sans text-body-sm font-medium px-8 py-3 hover:bg-verified/80 transition-colors"
              >
                All verified →
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
