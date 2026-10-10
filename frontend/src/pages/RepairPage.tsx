import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { WizardHeader } from '../components/layout/WizardHeader'
import { useApp } from '../lib/AppContext'
import { formatNumber } from '../lib/utils'

// Types each line character-by-character
function TypedLine({
  text,
  lineIndex,
  delay = 0,
  onComplete,
}: {
  text: string
  lineIndex: number
  delay?: number
  onComplete?: () => void
}) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)
  const CHAR_SPEED = 18 // ms per character

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        onComplete?.()
      }
    }, CHAR_SPEED)
    return () => clearInterval(interval)
  }, [started, text])

  return (
    <div className="flex items-start gap-4">
      <div className="font-mono text-micro text-dim w-5 shrink-0 mt-0.5 select-none">
        {lineIndex + 1}
      </div>
      <div className="font-sans text-body-sm text-soft-white leading-relaxed flex-1 min-h-[1.4em]">
        {displayed}
        {started && displayed.length < text.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-0.5 h-4 bg-bone ml-0.5 align-middle"
          />
        )}
      </div>
    </div>
  )
}

export function RepairPage() {
  const { verificationResult, contract, setStep } = useApp()
  const [copied, setCopied] = useState(false)
  const [revealedLines, setRevealedLines] = useState(0)

  if (!verificationResult || !contract) return null
  const { repair_instruction, summary } = verificationResult
  const lines = repair_instruction.split('\n').filter(Boolean)

  // Start typing first line immediately, each subsequent line starts after previous completes
  const handleLineComplete = (i: number) => {
    setRevealedLines(prev => Math.max(prev, i + 2)) // reveal next
  }

  // Kick off first line
  useEffect(() => {
    setRevealedLines(1)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(repair_instruction)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-void">
      <WizardHeader />

      <div className="pt-24 pb-16 px-8 lg:px-16 max-w-4xl mx-auto">
        {/* Label */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="mb-6">
          <div className="font-mono text-micro text-attention-text uppercase tracking-widest">FIX IN YOUR AI TOOL</div>
        </motion.div>

        {/* Headline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-4">
          <h2 className="font-serif text-hero-sm text-bone leading-tight">
            Generate a precise
            <br />repair instruction.
          </h2>
          <p className="mt-4 font-sans text-body text-muted max-w-lg">
            Copy this instruction and give it to your AI tool with the original file.
          </p>
        </motion.div>

        {/* Failure summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex items-center gap-6 py-4 border-y border-ghost/40"
        >
          <div>
            <div className="font-mono text-body text-failed-text">{formatNumber(summary.unexplained_losses)}</div>
            <div className="font-sans text-label text-dim">Unexplained losses</div>
          </div>
          <div className="w-px h-8 bg-ghost" />
          <div>
            <div className="font-mono text-body text-muted">{formatNumber(summary.before_row_count)}</div>
            <div className="font-sans text-label text-dim">Expected total</div>
          </div>
          <div className="w-px h-8 bg-ghost" />
          <div>
            <div className="font-mono text-body text-muted">{contract.entity_key}</div>
            <div className="font-sans text-label text-dim">Entity key</div>
          </div>
        </motion.div>

        {/* Repair instruction — typed out */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-micro text-dim uppercase tracking-widest">REPAIR INSTRUCTION</div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 font-mono text-label text-muted hover:text-bone border border-ghost hover:border-muted px-3 py-1.5 transition-all"
            >
              {copied ? (
                <><span className="text-verified-text">✓</span> Copied</>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-60">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M2 8V2h6" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  Copy instruction
                </>
              )}
            </button>
          </div>

          <div className="border border-ghost bg-surface p-6 space-y-3">
            {lines.map((line, i) =>
              i < revealedLines ? (
                <TypedLine
                  key={i}
                  text={line}
                  lineIndex={i}
                  delay={0}
                  onComplete={() => handleLineComplete(i)}
                />
              ) : (
                // Placeholder keeping height stable
                <div key={i} className="flex items-start gap-4 opacity-0">
                  <div className="w-5 shrink-0 font-mono text-micro">{i + 1}</div>
                  <div className="font-sans text-body-sm min-h-[1.4em]">&nbsp;</div>
                </div>
              )
            )}
          </div>
        </motion.div>

        {/* Next steps */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 p-4 border border-ghost/40 bg-surface/50">
          <div className="font-mono text-micro text-dim uppercase tracking-widest mb-2">NEXT STEPS</div>
          <ol className="space-y-1.5">
            {[
              'Copy the instruction above.',
              'Open your preferred AI tool (ChatGPT, Claude, etc.).',
              'Provide the original file and this instruction.',
              'Download the corrected output.',
              'Come back here to re-verify.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 font-sans text-label text-muted">
                <span className="font-mono text-micro text-ghost mt-0.5 shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-10 flex items-center justify-between pt-6 border-t border-ghost"
        >
          <button onClick={() => setStep('evidence')} className="font-sans text-label text-muted hover:text-bone transition-colors">
            ← Back to evidence
          </button>
          <button
            onClick={() => setStep('reverify')}
            className="flex items-center gap-2 bg-bone text-void font-sans text-body-sm font-medium px-8 py-3 hover:bg-soft-white transition-colors"
          >
            Upload corrected file →
          </button>
        </motion.div>
      </div>
    </div>
  )
}
