import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { WizardHeader } from '../components/layout/WizardHeader'
import { useApp } from '../lib/AppContext'
import { getClauseLabel, getClauseIcon, cn } from '../lib/utils'
import type { Clause, ClauseType } from '../types/contract'

const CLAUSE_DESCRIPTIONS: Record<ClauseType, string> = {
  PRESERVE_ENTITY:  'Every unique entity key in the original must exist in the output.',
  DEDUPE:           'Duplicate records by this key may be removed.',
  NO_NEW_ENTITY:    'No new entity keys may appear that were not in the original.',
  NORMALIZE:        'Column values must conform to the specified normalization rule.',
  NO_NEW_NULLS:     'No additional null values may be introduced in this column.',
  PRESERVE_SUM:     'The aggregate total must remain within the stated tolerance.',
  UNCHANGED_COLUMN: 'Column values must be identical for all surviving entities.',
  ROW_COUNT_RANGE:  'Output row count must stay within the approved ratio range.',
}

function clauseParamSummary(clause: Clause): string {
  switch (clause.type) {
    case 'PRESERVE_ENTITY':
    case 'DEDUPE':
    case 'NO_NEW_ENTITY':
      return clause.params.key
    case 'NORMALIZE':
      return `${clause.params.column} → ${clause.params.rule}`
    case 'NO_NEW_NULLS':
      return clause.params.column
    case 'UNCHANGED_COLUMN':
      return clause.params.column
    case 'PRESERVE_SUM':
      return `${clause.params.column} ±${clause.params.tolerance_value}${clause.params.tolerance_type === 'percentage' ? '%' : ''}`
    case 'ROW_COUNT_RANGE':
      return `${clause.params.min_ratio * 100}% – ${clause.params.max_ratio * 100}%`
    default:
      return ''
  }
}

// Highlighted span in instruction matching clause keywords
function HighlightedInstruction({
  instruction,
  activeClause,
}: {
  instruction: string
  activeClause: Clause | null
}) {
  if (!activeClause) return (
    <blockquote className="font-sans text-body text-soft-white leading-relaxed italic">
      "{instruction}"
    </blockquote>
  )

  // Keywords per clause type
  const keywordMap: Record<ClauseType, string[]> = {
    PRESERVE_ENTITY:  ['preserve', 'keep every', 'retain every', 'don\'t lose', 'every unique', 'every customer'],
    DEDUPE:           ['remove duplicate', 'deduplicate', 'dedupe'],
    NO_NEW_ENTITY:    ['don\'t add', 'do not add', 'no new', 'no additional'],
    NORMALIZE:        ['normalize', 'normalise', 'standard format', 'digits only', 'phone'],
    NO_NEW_NULLS:     ['no null', 'don\'t introduce null'],
    PRESERVE_SUM:     ['preserve revenue', 'revenue unchanged', 'preserve total'],
    UNCHANGED_COLUMN: ['don\'t modify email', 'do not modify', 'unchanged', 'leave email'],
    ROW_COUNT_RANGE:  ['row count', 'keep at least'],
  }

  const keywords = keywordMap[activeClause.type] ?? []
  let text = instruction
  let parts: { text: string; highlight: boolean }[] = [{ text, highlight: false }]

  keywords.forEach(kw => {
    const regex = new RegExp(`(${kw})`, 'gi')
    parts = parts.flatMap(part => {
      if (part.highlight) return [part]
      const split = part.text.split(regex)
      return split.map(s => ({ text: s, highlight: regex.test(s) }))
    })
  })

  return (
    <blockquote className="font-sans text-body text-soft-white leading-relaxed italic">
      "
      {parts.map((p, i) =>
        p.highlight ? (
          <mark key={i} className="bg-attention-dim text-attention-text not-italic px-0.5 rounded-sm">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
      "
    </blockquote>
  )
}

export function ContractPage() {
  const { contract, setContract, setStep, instruction } = useApp()
  const [disabled, setDisabled] = useState<Set<string>>(new Set())
  const [hovered, setHovered] = useState<string | null>(null)

  if (!contract) return null

  const toggleDisable = (id: string) => {
    setDisabled(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const activeClauses = contract.clauses.filter(c => !disabled.has(c.id))
  const hoveredClause = contract.clauses.find(c => c.id === hovered) ?? null

  const handleApprove = () => {
    const approved = {
      ...contract,
      status: 'APPROVED' as const,
      clauses: activeClauses,
    }
    setContract(approved)
    setStep('verifying')
  }

  return (
    <div className="min-h-screen bg-void">
      <WizardHeader />

      <div className="pt-24 pb-16 px-8 lg:px-16 max-w-5xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="font-mono text-micro text-muted uppercase tracking-widest mb-4">STEP 2 OF 4</div>
          <h2 className="font-serif text-hero-sm text-bone leading-tight">
            What exactly
            <br />are we proving?
          </h2>
          <p className="mt-4 font-sans text-body text-muted max-w-lg">
            We convert your instructions into a machine-checkable contract.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: proof sheet */}
          <div className="lg:col-span-3">
            {/* Trust attribution */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6 mb-8 py-3 border-y border-ghost/40"
            >
              {['AI PROPOSES', 'YOU APPROVE', 'CODE VERIFIES'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className="w-4 h-px bg-ghost" />}
                  <span className={cn(
                    'font-mono text-micro uppercase tracking-widest',
                    i === 1 ? 'text-bone' : 'text-dim'
                  )}>{s}</span>
                </div>
              ))}
            </motion.div>

            {/* WHAT WE WILL PROVE header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mb-6"
            >
              <div className="font-mono text-micro text-dim uppercase tracking-widest">
                WHAT WE WILL PROVE — {activeClauses.length} CLAUSE{activeClauses.length !== 1 ? 'S' : ''}
              </div>
            </motion.div>

            {/* Proof sheet rows */}
            <div className="space-y-0">
              {contract.clauses.map((clause, i) => {
                const isDisabled = disabled.has(clause.id)
                const isHovered = hovered === clause.id

                return (
                  <motion.div
                    key={clause.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.07 }}
                    className={cn(
                      'group relative flex items-start gap-4 py-5 border-b transition-all duration-200',
                      isDisabled
                        ? 'border-ghost/20 opacity-35'
                        : isHovered
                        ? 'border-muted/50 bg-surface/50'
                        : 'border-ghost/40 hover:border-ghost'
                    )}
                    onMouseEnter={() => setHovered(clause.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* Number */}
                    <div className="font-mono text-micro text-dim w-6 shrink-0 pt-1 select-none">
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    {/* Icon */}
                    <div className={cn('text-body-lg w-6 shrink-0 font-mono transition-colors', isDisabled ? 'text-ghost' : 'text-muted')}>
                      {getClauseIcon(clause.type)}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-label text-muted uppercase tracking-widest mb-1">
                        {getClauseLabel(clause.type)}
                      </div>
                      <div className={cn('font-sans text-body transition-colors', isDisabled ? 'text-dim' : 'text-bone')}>
                        {clause.label}
                      </div>
                      <div className="font-mono text-micro text-dim mt-1.5">
                        {clauseParamSummary(clause)}
                      </div>
                    </div>

                    {/* Disable toggle */}
                    <button
                      onClick={() => toggleDisable(clause.id)}
                      className={cn(
                        'shrink-0 w-6 h-6 flex items-center justify-center transition-all duration-150',
                        'opacity-0 group-hover:opacity-100',
                        isDisabled
                          ? 'text-dim hover:text-bone'
                          : 'text-ghost hover:text-failed-text'
                      )}
                      title={isDisabled ? 'Re-enable clause' : 'Disable clause'}
                    >
                      {isDisabled ? '↺' : '×'}
                    </button>
                  </motion.div>
                )
              })}
            </div>

            {disabled.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 font-sans text-label text-dim"
              >
                {disabled.size} clause{disabled.size > 1 ? 's' : ''} disabled —{' '}
                <button
                  onClick={() => setDisabled(new Set())}
                  className="text-muted hover:text-bone transition-colors underline underline-offset-2"
                >
                  restore all
                </button>
              </motion.div>
            )}

            {/* Entity key */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex items-center gap-4"
            >
              <div className="font-mono text-micro text-dim uppercase tracking-widest">ENTITY KEY</div>
              <div className="font-mono text-body-sm text-bone px-3 py-1 border border-ghost bg-surface">
                {contract.entity_key ?? 'NOT DEFINED'}
              </div>
            </motion.div>

            {/* Compiler notes */}
            {contract.compiler_notes.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="mt-6 p-4 border border-ghost/30 bg-surface/50"
              >
                <div className="font-mono text-micro text-dim uppercase tracking-widest mb-2">COMPILER NOTES</div>
                {contract.compiler_notes.map((note, i) => (
                  <div key={i} className="font-sans text-label text-muted flex gap-2">
                    <span className="text-ghost">—</span>{note}
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right: instruction panel with live highlighting */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="sticky top-28"
            >
              <div className="font-mono text-micro text-dim uppercase tracking-widest mb-3">YOUR INSTRUCTION</div>
              <div className="p-5 border border-ghost bg-surface min-h-[120px]">
                <HighlightedInstruction
                  instruction={instruction || contract.instruction}
                  activeClause={hoveredClause}
                />
              </div>
              {hoveredClause && (
                <motion.div
                  key={hoveredClause.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 p-3 border border-ghost/40 bg-surface/60"
                >
                  <div className="font-mono text-micro text-dim uppercase tracking-widest mb-1">
                    {getClauseLabel(hoveredClause.type)}
                  </div>
                  <p className="font-sans text-label text-muted leading-relaxed">
                    {CLAUSE_DESCRIPTIONS[hoveredClause.type]}
                  </p>
                  <div className="mt-2 font-mono text-micro text-ghost">
                    MODE: DETERMINISTIC
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Action bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-between pt-8 mt-10 border-t border-ghost"
        >
          <button
            onClick={() => setStep('upload')}
            className="font-sans text-body-sm text-muted hover:text-bone transition-colors"
          >
            ← Back to upload
          </button>
          <div className="flex items-center gap-4">
            {activeClauses.length === 0 && (
              <span className="font-sans text-label text-failed-text">
                At least one clause required
              </span>
            )}
            <button
              onClick={handleApprove}
              disabled={activeClauses.length === 0}
              className={cn(
                'flex items-center gap-2 px-8 py-3 font-sans text-body-sm font-medium transition-all',
                activeClauses.length > 0
                  ? 'bg-bone text-void hover:bg-soft-white'
                  : 'bg-surface border border-ghost text-dim cursor-not-allowed'
              )}
            >
              Approve & verify →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
