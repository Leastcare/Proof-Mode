export type ClauseType =
  | 'PRESERVE_ENTITY'
  | 'DEDUPE'
  | 'NO_NEW_ENTITY'
  | 'NORMALIZE'
  | 'NO_NEW_NULLS'
  | 'PRESERVE_SUM'
  | 'UNCHANGED_COLUMN'
  | 'ROW_COUNT_RANGE'

export type NormalizationRule = 'digits_only' | 'lowercase' | 'uppercase' | 'trim_whitespace'

export type ContractStatus = 'PROPOSED' | 'APPROVED'

export interface ClauseBase {
  id: string
  type: ClauseType
  label: string
  status_before_verification: 'PROPOSED'
}

export interface PreserveEntityClause extends ClauseBase {
  type: 'PRESERVE_ENTITY'
  params: { key: string }
}

export interface DedupeClause extends ClauseBase {
  type: 'DEDUPE'
  params: { key: string }
}

export interface NoNewEntityClause extends ClauseBase {
  type: 'NO_NEW_ENTITY'
  params: { key: string }
}

export interface NormalizeClause extends ClauseBase {
  type: 'NORMALIZE'
  params: { column: string; rule: NormalizationRule }
}

export interface NoNewNullsClause extends ClauseBase {
  type: 'NO_NEW_NULLS'
  params: { column: string }
}

export interface PreserveSumClause extends ClauseBase {
  type: 'PRESERVE_SUM'
  params: { column: string; tolerance_type: 'absolute' | 'percentage'; tolerance_value: number }
}

export interface UnchangedColumnClause extends ClauseBase {
  type: 'UNCHANGED_COLUMN'
  params: { column: string; apply_to: 'surviving_entities' }
}

export interface RowCountRangeClause extends ClauseBase {
  type: 'ROW_COUNT_RANGE'
  params: { min_ratio: number; max_ratio: number }
}

export type Clause =
  | PreserveEntityClause
  | DedupeClause
  | NoNewEntityClause
  | NormalizeClause
  | NoNewNullsClause
  | PreserveSumClause
  | UnchangedColumnClause
  | RowCountRangeClause

export interface Ambiguity {
  id: string
  field: string
  message: string
  options: string[]
  required: boolean
  resolved?: string
}

export interface Contract {
  version: string
  instruction: string
  entity_key: string | null
  status: ContractStatus
  clauses: Clause[]
  ambiguities: Ambiguity[]
  compiler_notes: string[]
}
