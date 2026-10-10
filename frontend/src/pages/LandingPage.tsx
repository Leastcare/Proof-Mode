import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../lib/AppContext'

const STEP_LABELS = ['UPLOAD', 'SET CONTRACT', 'VERIFY', 'REVIEW & FIX']

// Drifting evidence IDs with positions
const DRIFT_IDS = [
  { id: 'CUS-01842', x: 68, y: 18, delay: 0.2 },
  { id: 'CUS-01730', x: 74, y: 32, delay: 0.8 },
  { id: 'CUS-02711', x: 62, y: 48, delay: 1.4 },
  { id: 'CUS-01965', x: 78, y: 62, delay: 0.5 },
  { id: 'CUS-00847', x: 58, y: 75, delay: 1.1 },
  { id: 'CUS-03201', x: 72, y: 86, delay: 1.7 },
  { id: 'CUS-00412', x: 85, y: 22, delay: 2.1 },
  { id: 'CUS-04891', x: 55, y: 40, delay: 0.3 },
  { id: 'CUS-07234', x: 80, y: 55, delay: 1.9 },
]

const ABOUT_ITEMS = [
  {
    num: '01',
    title: 'AI proposes.',
    body: 'Your plain-English instruction is compiled into a machine-checkable contract from a closed vocabulary of 8 rule types.',
  },
  {
    num: '02',
    title: 'You approve.',
    body: 'Before any verification runs, you review every clause. Edit it, remove ambiguity, confirm what will be proven.',
  },
  {
    num: '03',
    title: 'Code verifies.',
    body: 'A deterministic Python engine checks each clause. Every verdict is backed by exact evidence — never AI confidence.',
  },
  {
    num: '04',
    title: 'If it fails, you fix it.',
    body: 'ProofMode generates a precise repair instruction. Send it back to your AI tool, upload the corrected file, re-verify.',
  },
]

function FilmModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-sm px-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-2xl w-full border border-ghost bg-charcoal p-10 text-center"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-5 font-mono text-label text-muted hover:text-bone transition-colors">✕</button>
        <div className="w-16 h-16 rounded-full border border-ghost flex items-center justify-center mx-auto mb-6">
          <span className="text-muted text-body">▶</span>
        </div>
        <div className="font-mono text-micro text-dim uppercase tracking-widest mb-3">DEMO FILM</div>
        <h3 className="font-serif text-title text-bone mb-4">Coming soon.</h3>
        <p className="font-sans text-body text-muted leading-relaxed max-w-sm mx-auto">
          A short film showing the full ProofMode verification loop — from instruction to proof.
        </p>
        <div className="mt-8 pt-6 border-t border-ghost">
          <p className="font-sans text-label text-dim mb-4">In the meantime, try it yourself:</p>
          <button onClick={onClose} className="font-sans text-body-sm text-bone border border-muted px-6 py-3 hover:bg-surface transition-colors">
            Try a verification →
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function LandingPage() {
  const { setStep } = useApp()
  const [showFilm, setShowFilm] = useState(false)

  return (
    <div className="relative bg-void overflow-x-hidden">
      {/* ── Fixed header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <span className="font-sans text-label font-medium text-bone tracking-widest uppercase">ProofMode</span>
        <nav className="flex items-center gap-6">
          <a href="#about" className="text-label text-muted hover:text-soft-white transition-colors uppercase tracking-wider">About</a>
          <button
            onClick={() => setStep('upload')}
            className="text-label text-bone border border-ghost hover:border-muted px-4 py-2 transition-colors uppercase tracking-wider"
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <div className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 px-8 lg:px-16 overflow-hidden">

        {/* Full-bleed background line texture */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(244,241,234,0.04) 28px, rgba(244,241,234,0.04) 29px)`,
          }}
        />

        {/* Right-side radial glow */}
        <div className="absolute right-0 top-0 w-2/3 h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 85% 40%, rgba(139,137,131,0.08) 0%, transparent 55%)' }}
        />

        {/* Drifting evidence ID fragments */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {DRIFT_IDS.map(({ id, x, y, delay }) => (
            <motion.div
              key={id}
              className="absolute font-mono text-label text-muted/40 whitespace-nowrap select-none"
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 0.5, 0.25, 0.5, 0], y: [8, 0, -4, 0, -8] }}
              transition={{ delay, duration: 8, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            >
              {id}
            </motion.div>
          ))}
        </div>

        {/* Content — centered vertically, left-anchored with max-width */}
        <div className="relative z-10 max-w-5xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10"
          >
            <span className="font-mono text-micro text-muted uppercase tracking-[0.2em]">
              AI OUTPUT VERIFICATION · 01
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif leading-none text-bone"
            style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)' }}
          >
            Did it actually
            <br />
            <em>do what <span className="text-soft-white">you</span> asked?</em>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-8 max-w-lg font-sans text-body lg:text-body-lg text-muted leading-relaxed"
          >
            ProofMode verifies that AI transformations follow
            your instructions — every record accounted for.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.05 }}
            className="mt-12 flex items-center gap-6"
          >
            <button
              onClick={() => setStep('upload')}
              className="flex items-center gap-2 bg-bone text-void font-sans text-body-sm font-medium px-7 py-3.5 hover:bg-soft-white transition-colors"
            >
              Try a verification <span className="opacity-50">→</span>
            </button>
            <button
              onClick={() => setShowFilm(true)}
              className="flex items-center gap-3 text-muted hover:text-soft-white transition-colors group"
            >
              <div className="w-9 h-9 rounded-full border border-ghost flex items-center justify-center group-hover:border-muted transition-colors">
                <span className="text-micro ml-0.5">▶</span>
              </div>
              <span className="font-sans text-body-sm">Watch film</span>
            </button>
          </motion.div>

          {/* Step preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="mt-20 flex items-start gap-10"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-px bg-ghost" />
              <span className="font-mono text-micro text-dim uppercase tracking-widest">SCROLL</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {STEP_LABELS.map(label => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-ghost" />
                  <span className="font-sans text-label text-dim uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Vertical right edge line */}
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.5 }}
          style={{ transformOrigin: 'top' }}
          className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-ghost to-transparent pointer-events-none"
        />
      </div>

      {/* ── About section ── */}
      <div id="about" className="relative z-10 px-8 lg:px-16 pb-24 border-t border-ghost/40">
        <div className="max-w-5xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <div className="font-mono text-micro text-dim uppercase tracking-widest mb-4">HOW IT WORKS</div>
            <h2 className="font-serif text-hero-sm text-bone leading-tight">
              AI did the work.
              <br />
              <em>We prove what happened.</em>
            </h2>
            <p className="mt-6 font-sans text-body text-muted max-w-lg leading-relaxed">
              ProofMode separates two reliability layers: an assistive contract compiler
              and an authoritative deterministic verifier.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
            {ABOUT_ITEMS.map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="border border-ghost p-6 hover:border-muted transition-colors"
              >
                <div className="font-mono text-micro text-dim mb-3">{item.num}</div>
                <div className="font-serif text-title text-bone mb-3">{item.title}</div>
                <p className="font-sans text-body-sm text-muted leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border-t border-ghost pt-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
          >
            <div>
              <div className="font-mono text-micro text-dim uppercase tracking-widest mb-2">THE CORE PRINCIPLE</div>
              <p className="font-sans text-body text-soft-white max-w-lg">
                If ProofMode cannot prove it, it will not say it passed.
                Every verdict is backed by deterministic evidence.
              </p>
            </div>
            <button
              onClick={() => setStep('upload')}
              className="shrink-0 flex items-center gap-2 bg-bone text-void font-sans text-body-sm font-medium px-6 py-3 hover:bg-soft-white transition-colors"
            >
              Start a verification →
            </button>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showFilm && <FilmModal onClose={() => setShowFilm(false)} />}
      </AnimatePresence>
    </div>
  )
}
