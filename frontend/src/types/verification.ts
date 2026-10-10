export type ClauseResultStatus = 'VERIFIED' | 'FAILED' | 'CANT_VERIFY'
export type OverallStatus = 'VERIFIED' | 'FAILED' | 'CANT_VERIFY'
export type EvidenceKind =
  | 'missing_id'
  | 'new_id'
  | 'duplicate_group'
  | 'column_change'
  | 'invalid_format'
  | 'null_increase'
  | 'aggregate_mismatch'
  | 'row_count_violation'

export type ReconciliationCategory =
  | 'SURVIVED'
  | 'LEGITIMATELY_REMOVED_DUPLICATE'
  | 'UNEXPLAINED_LOSS'
  | 'NEW_ENTITY'

export interface VerificationSummary {
  overall_status: OverallStatus
  before_row_count: number
  after_row_count: number
  surviving_rows: number
  explained_removals: number
  unexplained_losses: number
  new_entities: number
  verified_clause_count: number
  failed_clause_count: number
  cant_verify_clause_count: number
}

export interface ReconciliationCounts {
  SURVIVED: number
  LEGITIMATELY_REMOVED_DUPLICATE: number
  UNEXPLAINED_LOSS: number
  NEW_ENTITY: number
}

export interface Reconciliation {
  entity_key: string
  counts: ReconciliationCounts
  consistency_check: {
    input_total: number
    accounted_total: number
    is_balanced: boolean
  }
}

export interface ClauseResult {
  clause_id: string
  type: string
  label: string
  status: ClauseResultStatus
  verification_mode: 'DETERMINISTIC'
  summary: string
  counts: Record<string, number>
  evidence_refs: string[]
}

export interface EvidenceRecord {
  id: string
  kind: EvidenceKind
  entity_key: string | null
  before_row: Record<string, string> | null
  after_row: Record<string, string> | null
  contract_context: {
    clause_id: string
    clause_type: string
  }
  explanation: string
}

export interface VerificationResponse {
  run_id: string
  contract_status: 'APPROVED'
  verification_mode: 'DETERMINISTIC'
  summary: VerificationSummary
  reconciliation: Reconciliation
  clause_results: ClauseResult[]
  evidence: EvidenceRecord[]
  highlighted_ids: string[]
  repair_instruction: string
  warnings: string[]
}

// App flow state
export type FlowStep =
  | 'landing'
  | 'upload'
  | 'contract'
  | 'verifying'
  | 'results'
  | 'unexplained'
  | 'evidence'
  | 'repair'
  | 'reverify'
  | 'success'

export interface FlowState {
  step: FlowStep
  originalFile: File | null
  transformedFile: File | null
  correctedFile: File | null
  instruction: string
  contract: import('./contract').Contract | null
  verificationResult: VerificationResponse | null
  selectedEvidenceId: string | null
  evidenceIndex: number
  isDemoMode: boolean
}
