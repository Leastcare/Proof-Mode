import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { WizardHeader } from '../components/layout/WizardHeader'
import { useApp } from '../lib/AppContext'
import { compileContract, previewColumns } from '../lib/api'
import { DEMO_INSTRUCTION, MOCK_CONTRACT } from '../lib/mockData'
import { cn } from '../lib/utils'

interface FileCardProps {
  label: string
  sublabel: string
  file: File | null
  onFile: (f: File) => void
  accept?: string
}

function FileCard({ label, sublabel, file, onFile, accept = '.csv' }: FileCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative border transition-all duration-200 p-6 cursor-pointer group',
        dragging ? 'border-bone bg-surface-raised' : 'border-ghost hover:border-muted bg-surface'
      )}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />

      {/* Label */}
      <div className="font-mono text-micro text-muted uppercase tracking-widest mb-4">
        {label}
      </div>

      {file ? (
        /* File loaded state */
        <div>
          <div className="flex items-start gap-3 mb-3">
            <div className="mt-0.5 text-muted">
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M9 1H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7L9 1Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 1v6h6" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <div className="font-mono text-body-sm text-bone">{file.name}</div>
              <div className="font-sans text-label text-muted mt-0.5">
                {(file.size / 1024).toFixed(0)} KB
              </div>
            </div>
          </div>
          <div className="font-mono text-micro text-dim">
            — {sublabel}
          </div>
          <div className="mt-4 text-label text-muted border border-ghost px-3 py-1.5 inline-block hover:border-muted hover:text-bone transition-colors">
            Change file
          </div>
        </div>
      ) : (
        /* Empty state */
        <div>
          <div className="font-sans text-body-lg text-bone mb-2">Choose file</div>
          <div className="font-sans text-label text-dim">or drag and drop</div>
          <div className="mt-4 font-mono text-micro text-dim">.csv files only</div>
        </div>
      )}
    </motion.div>
  )
}

export function UploadPage() {
  const {
    originalFile, setOriginalFile,
    transformedFile, setTransformedFile,
    instruction, setInstruction,
    setContract, setStep, setIsDemoMode
  } = useApp()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedDemo, setUsedDemo] = useState(false)
  const [columnPreview, setColumnPreview] = useState<string[] | null>(null)

  const canContinue = originalFile && transformedFile && instruction.trim().length > 10

  const handleOriginalFile = async (f: File) => {
    setOriginalFile(f)
    setColumnPreview(null)
    // Fetch column preview from backend
    try {
      const preview = await previewColumns(f)
      setColumnPreview(preview.columns ?? [])
    } catch {
      // If backend isn't running, skip preview silently
    }
  }

  const handleContinue = async () => {
    if (!canContinue) return

    // Demo mode: contract already set, just advance
    if (usedDemo) {
      setStep('contract')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const contract = await compileContract(instruction, originalFile)
      setContract(contract)
      setStep('contract')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compile contract.'
      setError(`${msg} — Is the backend running? (cd backend && uvicorn app.main:app --reload)`)
    } finally {
      setLoading(false)
    }
  }

  const handleUseDemo = () => {
    setInstruction(DEMO_INSTRUCTION)
    setUsedDemo(true)
    setIsDemoMode(true)
    // Use the mock contract directly — no backend call needed
    setContract({ ...MOCK_CONTRACT, status: 'PROPOSED' })
    const makeFile = (name: string) =>
      new File(['mock'], name, { type: 'text/csv' })
    setOriginalFile(makeFile('customers_before.csv'))
    setTransformedFile(makeFile('customers_after_broken.csv'))
  }

  return (
    <div className="min-h-screen bg-void">
      <WizardHeader />

      <div className="pt-24 pb-16 px-8 lg:px-16 max-w-5xl mx-auto">
        {/* Page headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="font-serif text-hero-sm text-bone">
            Start with <em>your</em> files
          </h2>
          <p className="mt-4 font-sans text-body text-muted max-w-md mx-auto">
            Upload the original dataset and the AI-transformed output you want to verify.
          </p>
        </motion.div>

        {/* File upload cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div>
            <div className="font-mono text-micro text-dim uppercase tracking-widest mb-3">
              ORIGINAL
            </div>
            <FileCard
              label="ORIGINAL DATASET"
              sublabel="The file before AI transformation"
              file={originalFile}
              onFile={handleOriginalFile}
            />
            {originalFile && (
              <div className="mt-2 font-mono text-micro text-dim">
                {columnPreview
                  ? `${columnPreview.length} columns: ${columnPreview.slice(0, 5).join(', ')}${columnPreview.length > 5 ? '…' : ''}`
                  : '10,000 rows · 24 columns'}
              </div>
            )}
          </div>

          {/* Arrow between */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 mt-16 pointer-events-none">
          </div>

          <div>
            <div className="font-mono text-micro text-dim uppercase tracking-widest mb-3">
              AI OUTPUT
            </div>
            <FileCard
              label="AI-TRANSFORMED OUTPUT"
              sublabel="The file produced by AI"
              file={transformedFile}
              onFile={setTransformedFile}
            />
            {transformedFile && (
              <div className="mt-2 font-mono text-micro text-dim">
                9,863 rows · 24 columns
              </div>
            )}
          </div>
        </div>

        {/* Instruction input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className="font-mono text-micro text-dim uppercase tracking-widest mb-3">
            YOUR ORIGINAL INSTRUCTION TO AI
          </div>
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder='e.g. "Clean this customer dataset. Remove duplicates. Normalize phone numbers. Preserve every unique customer."'
            rows={4}
            className="w-full bg-surface border border-ghost hover:border-muted focus:border-bone text-bone font-sans text-body p-4 resize-none transition-colors placeholder:text-dim"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-micro text-dim">
              {instruction.length} characters
            </span>
            {!usedDemo && (
              <button
                onClick={handleUseDemo}
                className="font-sans text-label text-muted hover:text-bone transition-colors underline underline-offset-2"
              >
                Use demo data →
              </button>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 border border-failed/40 bg-failed-dim px-4 py-3 font-sans text-body-sm text-failed-text">
            {error}
          </div>
        )}

        {/* Continue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="font-sans text-label text-dim">
            {!originalFile && 'Upload original CSV'}
            {originalFile && !transformedFile && 'Upload transformed CSV'}
            {originalFile && transformedFile && !instruction.trim() && 'Enter your instruction'}
            {canContinue && !loading && ''}
          </div>

          <button
            onClick={handleContinue}
            disabled={!canContinue || loading}
            className={cn(
              'flex items-center gap-2 px-8 py-3 font-sans text-body-sm font-medium transition-all',
              canContinue && !loading
                ? 'bg-bone text-void hover:bg-soft-white'
                : 'bg-surface border border-ghost text-dim cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <span className="animate-pulse">Compiling contract</span>
                <span className="font-mono text-micro animate-pulse">···</span>
              </>
            ) : (
              <>Build the proof →</>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
