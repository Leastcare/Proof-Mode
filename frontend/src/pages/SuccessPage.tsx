import { useEffect, useState } from 'react'
import { motion, useAnimationControls } from 'motion/react'
import { WizardHeader } from '../components/layout/WizardHeader'
import { useApp } from '../lib/AppContext'
import { formatNumber, getClauseLabel, getClauseIcon } from '../lib/utils'
import type { VerificationResponse } from '../types/verification'
import type { Contract } from '../types/contract'

// ── Report generator ──────────────────────────────────────────────────────────
function generateReport(result: VerificationResponse, contract: Contract | null): string {
  const s = result.summary
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const lines: string[] = []
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('PROOFMODE — VERIFICATION REPORT')
  lines.push(`Generated: ${now} UTC`)
  lines.push(`Run ID:    ${result.run_id}`)
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push('OVERALL STATUS')
  lines.push('─────────────────────────────────────────────────────────────')
  lines.push(`  Status:             ${s.overall_status}`)
  lines.push(`  Before row count:   ${formatNumber(s.before_row_count)}`)
  lines.push(`  After row count:    ${formatNumber(s.after_row_count)}`)
  lines.push(`  Explained removals: ${formatNumber(s.explained_removals)}`)
  lines.push(`  Unexplained losses: ${formatNumber(s.unexplained_losses)}`)
  lines.push(`  New entities:       ${formatNumber(s.new_entities)}`)
  lines.push('')
  lines.push('RECONCILIATION')
  lines.push('─────────────────────────────────────────────────────────────')
  const r = result.reconciliation
  lines.push(`  Entity key:   ${r.entity_key}`)
  lines.push(`  Survived:     ${formatNumber(r.counts.SURVIVED)}`)
  lines.push(`  Deduped:      ${formatNumber(r.counts.LEGITIMATELY_REMOVED_DUPLICATE)}`)
  lines.push(`  Unexplained:  ${formatNumber(r.counts.UNEXPLAINED_LOSS)}`)
  lines.push(`  New entity:   ${formatNumber(r.counts.NEW_ENTITY)}`)
  lines.push(`  Balanced:     ${r.consistency_check.is_balanced ? 'YES' : 'NO'}`)
  lines.push('')
  if (contract) {
    lines.push('APPROVED CONTRACT')
    lines.push('─────────────────────────────────────────────────────────────')
    lines.push(`  Entity key:  ${contract.entity_key ?? 'not defined'}`)
    lines.push(`  Instruction: ${contract.instruction}`)
    lines.push('')
  }
  lines.push('CLAUSE RESULTS')
  lines.push('─────────────────────────────────────────────────────────────')
  for (const cr of result.clause_results) {
    lines.push(`  [${cr.status.padEnd(12)}] ${getClauseLabel(cr.type)}`)
    lines.push(`               ${cr.summary}`)
  }
  lines.push('')
  if (result.repair_instruction) {
    lines.push('REPAIR INSTRUCTION')
    lines.push('─────────────────────────────────────────────────────────────')
    result.repair_instruction.split('\n').forEach(l => lines.push(`  ${l}`))
    lines.push('')
  }
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('ProofMode — AI proposes. Human approves. Code verifies.')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  return lines.join('\n')
}

function downloadReport(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Ink-stamp "Verified." ─────────────────────────────────────────────────────
function InkStamp() {
  const controls = useAnimationControls()

  useEffect(() => {
    const seq = async () => {
      // Start large + transparent, compress down as if stamped
      await controls.start({
        scale: [1.3, 0.97, 1.02, 1],
        opacity: [0, 1, 1, 1],
        filter: ['blur(4px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
        transition: { duration: 0.7, times: [0, 0.4, 0.7, 1], ease: 'easeOut' },
      })
      // Subtle settle pulse
      await controls.start({
        scale: [1, 1.005, 1],
        transition: { duration: 1.2, ease: 'easeInOut' },
      })
    }
    const t = setTimeout(seq, 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      animate={controls}
      initial={{ scale: 1.3, opacity: 0 }}
      className="text-center my-10"
    >
      <span
        className="font-serif text-verified-text select-none"
        style={{ fontSize: 'clamp(4rem, 12vw, 9rem)', lineHeight: 1 }}
      >
        Verified.
      </span>
    </motion.div>
  )
}

export function SuccessPage() {
  const { verificationResult, contract, reset } = useApp()
  const [visibleClauses, setVisibleClauses] = useState(0)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    if (!verificationResult) return
    const total = verificationResult.clause_results.length
    // Reveal each clause row sequentially
    let i = 0
    const reveal = () => {
      if (i <= total) {
        setVisibleClauses(i)
        i++
        setTimeout(reveal, i <= total ? 180 : 0)
      } else {
        setTimeout(() => setShowActions(true), 300)
      }
    }
    // Start after stamp animation completes
    const t = setTimeout(reveal, 1800)
    return () => clearTimeout(t)
  }, [verificationResult])

  if (!verificationResult) return null
  const { summary, clause_results } = verificationResult

  return (
    <div className="min-h-screen bg-void overflow-hidden">
      <WizardHeader showSteps={false} onClose={reset} />

      <div className="relative pt-24 pb-16 px-8 lg:px-16 max-w-4xl mx-auto">
        {/* Subtle green ambient */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(74,124,89,0.06) 0%, transparent 60%)' }}
        />

        {/* Check ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-4"
        >
          <div className="w-14 h-14 rounded-full border-2 border-verified flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.55 }}
              className="text-verified-text text-xl"
            >
              ✓
            </motion.span>
          </div>
        </motion.div>

        {/* Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-center"
        >
          <div className="font-mono text-bone leading-none"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            {formatNumber(summary.before_row_count)} / {formatNumber(summary.after_row_count)}
          </div>
          <p className="mt-3 font-sans text-body text-muted">All records accounted for.</p>
        </motion.div>

        {/* Ink stamp */}
        <InkStamp />

        <p className="text-center font-sans text-body text-muted mb-10">
          The AI transformation follows your instructions.
        </p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="grid grid-cols-4 gap-6 mb-10 py-6 border-y border-ghost/40"
        >
          {[
            { label: 'Original records',  value: summary.before_row_count, color: 'text-bone' },
            { label: 'Records remain\nNo unexplained losses', value: summary.after_row_count, color: 'text-bone' },
            { label: 'Duplicates\n(as expected)',  value: summary.explained_removals, color: 'text-muted' },
            { label: 'Unexplained losses', value: summary.unexplained_losses, color: 'text-verified-text' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className={`font-mono text-title ${color}`}>{formatNumber(value)}</div>
              <div className="font-sans text-label text-dim mt-1 whitespace-pre-line">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Clause rows — staggered reveal */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={visibleClauses > 0 ? { opacity: 1 } : {}}
            className="font-mono text-micro text-dim uppercase tracking-widest mb-4"
          >
            ALL REQUIRED CHECKS PASSED
          </motion.div>
          <div className="space-y-0">
            {clause_results.map((result, i) => (
              <motion.div
                key={result.clause_id}
                initial={{ opacity: 0, x: -12 }}
                animate={i < visibleClauses ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 py-3 border-b border-ghost/30"
              >
                <div className="font-mono text-body-sm text-dim w-5 text-center">
                  {getClauseIcon(result.type)}
                </div>
                <div className="flex-1 font-mono text-label text-muted uppercase tracking-wider">
                  {getClauseLabel(result.type)}
                </div>
                <div className="font-sans text-label text-dim flex-1 hidden lg:block">
                  {result.summary}
                </div>
                <div className="font-mono text-label text-verified-text uppercase tracking-widest shrink-0">
                  ✓ VERIFIED
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-4"
          >
            <button
              onClick={() => {
                const content = generateReport(verificationResult, contract)
                const ts = new Date().toISOString().slice(0, 10)
                downloadReport(content, `proofmode-report-${ts}.txt`)
              }}
              className="flex items-center gap-2 border border-ghost text-muted font-sans text-body-sm px-6 py-3 hover:border-muted hover:text-bone transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 10V12H12V10M7 1V9M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              View full report
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 bg-bone text-void font-sans text-body-sm font-medium px-6 py-3 hover:bg-soft-white transition-colors"
            >
              Start a new verification
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
