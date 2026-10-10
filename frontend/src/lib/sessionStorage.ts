/**
 * Persist and restore verification flow state via localStorage.
 * Files (File objects) cannot be serialised — only metadata is saved.
 */

const KEY = 'proofmode_session_v1'

export interface PersistedSession {
  step: string
  instruction: string
  contract: unknown | null
  verificationResult: unknown | null
  evidenceIndex: number
  savedAt: string
}

export function saveSession(state: {
  step: string
  instruction: string
  contract: unknown | null
  verificationResult: unknown | null
  evidenceIndex: number
}): void {
  try {
    const payload: PersistedSession = {
      ...state,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // localStorage can be full or blocked — fail silently
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedSession
    // Don't restore very old sessions (>24 hours)
    const age = Date.now() - new Date(parsed.savedAt).getTime()
    if (age > 24 * 60 * 60 * 1000) {
      clearSession()
      return null
    }
    // Only restore if there's meaningful progress
    if (!parsed.step || parsed.step === 'landing') return null
    return parsed
  } catch {
    return null
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY)
  } catch { /* ignore */ }
}
