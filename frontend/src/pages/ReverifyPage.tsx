import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { WizardHeader } from '../components/layout/WizardHeader'
import { useApp } from '../lib/AppContext'
import { reverifyFiles } from '../lib/api'
import { MOCK_VERIFICATION_SUCCESS } from '../lib/mockData'
import { cn } from '../lib/utils'

export function ReverifyPage() {
  const {
    originalFile, contract,
    correctedFile, setCorrectedFile,
    setVerificationResult, setStep, isDemoMode
  } = useApp()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setCorrectedFile(f)
  }, [setCorrectedFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleReverify = async () => {
    if (!correctedFile) return
    setLoading(true)
    setError(null)

    if (isDemoMode) {
      // Demo mode: skip backend, use mock success result
      setTimeout(() => {
        setVerificationResult(MOCK_VERIFICATION_SUCCESS)
        setStep('success')
        setLoading(false)
      }, 2000)
      return
    }

    if (!originalFile || !contract) return
    try {
      const result = await reverifyFiles(originalFile, correctedFile, contract)
      setVerificationResult(result)
      setStep('success')
    } catch {
      setError('backend-unavailable')
    } finally {
      setLoading(false)
    }
  }

  const handleUseDemoResult = () => {
    setVerificationResult(MOCK_VERIFICATION_SUCCESS)
    setStep('success')
  }

  return (
    <div className="min-h-screen bg-void">
      <WizardHeader />

      <div className="pt-24 pb-16 px-8 lg:px-16 max-w-3xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="font-mono text-micro text-muted uppercase tracking-widest mb-4">
            STEP 4 OF 4 — RE-VERIFY
          </div>
          <h2 className="font-serif text-hero-sm text-bone leading-tight">
            Run verification
            <br />
            on the corrected file.
          </h2>
          <p className="mt-4 font-sans text-body text-muted">
            Upload the new output from your AI tool to confirm the fix.
          </p>
        </motion.div>

        {/* Approved contract reference */}
        {contract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 p-4 border border-ghost/40 bg-surface"
          >
            <div className="font-mono text-micro text-dim uppercase tracking-widest mb-2">
              APPROVED CONTRACT WILL BE REUSED
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-body-sm text-bone">{contract.entity_key}</div>
              <div className="text-ghost">·</div>
              <div className="font-sans text-label text-muted">
                {contract.clauses.length} clauses
              </div>
              <div className="text-ghost">·</div>
              <div className="font-mono text-label text-verified-text uppercase tracking-wider">
                APPROVED
              </div>
            </div>
          </motion.div>
        )}

        {/* Upload card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="font-mono text-micro text-dim uppercase tracking-widest mb-3">
            CORRECTED OUTPUT
          </div>

          <div
            className={cn(
              'border p-8 cursor-pointer transition-all',
              dragging ? 'border-bone bg-surface-raised' : 'border-ghost hover:border-muted bg-surface',
              correctedFile && 'border-verified/40 bg-verified-dim/20'
            )}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {correctedFile ? (
              <div className="flex items-center gap-4">
                <div className="text-verified-text">
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                    <path d="M11 1H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8L11 1Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M11 1v7h7" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div>
                  <div className="font-mono text-body-sm text-bone">{correctedFile.name}</div>
                  <div className="font-sans text-label text-muted mt-0.5">
                    10,000 rows · 24 columns
                  </div>
                </div>
                <div className="ml-auto font-mono text-label text-muted border border-ghost px-3 py-1.5 hover:border-muted hover:text-bone transition-colors">
                  Change file
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="font-sans text-body-lg text-bone mb-2">Choose file</div>
                <div className="font-sans text-label text-dim">or drag and drop</div>
                <div className="mt-3 font-mono text-micro text-dim">.csv files only</div>
              </div>
            )}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 border border-failed/40 bg-failed-dim px-5 py-4"
          >
            <div className="font-mono text-label text-failed-text uppercase tracking-widest mb-1">
              BACKEND UNAVAILABLE
            </div>
            <p className="font-sans text-body-sm text-muted mb-3">
              Could not reach the backend. Start it with{' '}
              <code className="font-mono text-bone">uvicorn app.main:app --reload</code>{' '}
              in the <code className="font-mono text-bone">backend/</code> folder, then retry.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setError(null); handleReverify() }}
                className="font-sans text-label text-muted border border-ghost px-4 py-2 hover:border-muted hover:text-bone transition-colors"
              >
                Retry
              </button>
              <button
                onClick={handleUseDemoResult}
                className="font-sans text-label text-bone border border-muted px-4 py-2 hover:bg-surface transition-colors"
              >
                Use demo result (Verified) →
              </button>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex items-center justify-between pt-6 border-t border-ghost"
        >
          <button
            onClick={() => setStep('repair')}
            className="font-sans text-label text-muted hover:text-bone transition-colors"
          >
            ← Back to repair
          </button>
          <button
            onClick={handleReverify}
            disabled={!correctedFile || loading}
            className={cn(
              'flex items-center gap-2 px-8 py-3 font-sans text-body-sm font-medium transition-all',
              correctedFile && !loading
                ? 'bg-bone text-void hover:bg-soft-white'
                : 'bg-surface border border-ghost text-dim cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <span className="animate-pulse">Re-verifying</span>
                <span className="font-mono text-micro animate-pulse">···</span>
              </>
            ) : (
              'Run re-verification →'
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
