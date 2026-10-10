import {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from 'react'
import type { FlowState, FlowStep } from '../types/verification'
import type { Contract } from '../types/contract'
import type { VerificationResponse } from '../types/verification'
import { saveSession, loadSession, clearSession } from './sessionStorage'

interface AppContextValue extends FlowState {
  setStep: (step: FlowStep) => void
  setOriginalFile: (file: File | null) => void
  setTransformedFile: (file: File | null) => void
  setCorrectedFile: (file: File | null) => void
  setInstruction: (instruction: string) => void
  setContract: (contract: Contract | null) => void
  setVerificationResult: (result: VerificationResponse | null) => void
  setSelectedEvidenceId: (id: string | null) => void
  setEvidenceIndex: (index: number) => void
  setIsDemoMode: (demo: boolean) => void
  reset: () => void
  hasSavedSession: boolean
  restoreSession: () => void
  dismissSavedSession: () => void
}

const defaultState: FlowState = {
  step: 'landing',
  originalFile: null,
  transformedFile: null,
  correctedFile: null,
  instruction: '',
  contract: null,
  verificationResult: null,
  selectedEvidenceId: null,
  evidenceIndex: 0,
  isDemoMode: false,
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlowState>(defaultState)
  const [hasSavedSession, setHasSavedSession] = useState(false)
  const [pendingSession, setPendingSession] = useState<ReturnType<typeof loadSession>>(null)

  // Check for saved session on mount
  useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setHasSavedSession(true)
      setPendingSession(saved)
    }
  }, [])

  // Auto-save state changes (skip file objects — not serialisable)
  useEffect(() => {
    if (state.step === 'landing') return
    saveSession({
      step: state.step,
      instruction: state.instruction,
      contract: state.contract,
      verificationResult: state.verificationResult,
      evidenceIndex: state.evidenceIndex,
    })
  }, [state.step, state.instruction, state.contract, state.verificationResult, state.evidenceIndex])

  const restoreSession = useCallback(() => {
    if (!pendingSession) return
    setState(s => ({
      ...s,
      step: pendingSession.step as FlowStep,
      instruction: pendingSession.instruction ?? '',
      contract: (pendingSession.contract as Contract) ?? null,
      verificationResult: (pendingSession.verificationResult as VerificationResponse) ?? null,
      evidenceIndex: pendingSession.evidenceIndex ?? 0,
    }))
    setHasSavedSession(false)
    setPendingSession(null)
  }, [pendingSession])

  const dismissSavedSession = useCallback(() => {
    clearSession()
    setHasSavedSession(false)
    setPendingSession(null)
  }, [])

  const setStep = useCallback((step: FlowStep) => setState(s => ({ ...s, step })), [])
  const setOriginalFile = useCallback((originalFile: File | null) => setState(s => ({ ...s, originalFile })), [])
  const setTransformedFile = useCallback((transformedFile: File | null) => setState(s => ({ ...s, transformedFile })), [])
  const setCorrectedFile = useCallback((correctedFile: File | null) => setState(s => ({ ...s, correctedFile })), [])
  const setInstruction = useCallback((instruction: string) => setState(s => ({ ...s, instruction })), [])
  const setContract = useCallback((contract: Contract | null) => setState(s => ({ ...s, contract })), [])
  const setVerificationResult = useCallback((verificationResult: VerificationResponse | null) => setState(s => ({ ...s, verificationResult })), [])
  const setSelectedEvidenceId = useCallback((selectedEvidenceId: string | null) => setState(s => ({ ...s, selectedEvidenceId })), [])
  const setEvidenceIndex = useCallback((evidenceIndex: number) => setState(s => ({ ...s, evidenceIndex })), [])
  const setIsDemoMode = useCallback((isDemoMode: boolean) => setState(s => ({ ...s, isDemoMode })), [])

  const reset = useCallback(() => {
    clearSession()
    setState(defaultState)
  }, [])

  return (
    <AppContext.Provider value={{
      ...state,
      setStep,
      setOriginalFile,
      setTransformedFile,
      setCorrectedFile,
      setInstruction,
      setContract,
      setVerificationResult,
      setSelectedEvidenceId,
      setEvidenceIndex,
      setIsDemoMode,
      reset,
      hasSavedSession,
      restoreSession,
      dismissSavedSession,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
