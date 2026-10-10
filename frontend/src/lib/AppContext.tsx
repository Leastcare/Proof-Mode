import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { FlowState, FlowStep } from '../types/verification'
import type { Contract } from '../types/contract'
import type { VerificationResponse } from '../types/verification'

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
  const reset = useCallback(() => setState(defaultState), [])

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
