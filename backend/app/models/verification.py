from __future__ import annotations
from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel


# ── Enums ─────────────────────────────────────────────────────────────────────

class ClauseResultStatus(str, Enum):
    VERIFIED     = "VERIFIED"
    FAILED       = "FAILED"
    CANT_VERIFY  = "CANT_VERIFY"


class OverallStatus(str, Enum):
    VERIFIED     = "VERIFIED"
    FAILED       = "FAILED"
    CANT_VERIFY  = "CANT_VERIFY"


class EvidenceKind(str, Enum):
    missing_id          = "missing_id"
    new_id              = "new_id"
    duplicate_group     = "duplicate_group"
    column_change       = "column_change"
    invalid_format      = "invalid_format"
    null_increase       = "null_increase"
    aggregate_mismatch  = "aggregate_mismatch"
    row_count_violation = "row_count_violation"


# ── Sub-objects ───────────────────────────────────────────────────────────────

class VerificationSummary(BaseModel):
    overall_status:          OverallStatus
    before_row_count:        int
    after_row_count:         int
    surviving_rows:          int
    explained_removals:      int
    unexplained_losses:      int
    new_entities:            int
    verified_clause_count:   int
    failed_clause_count:     int
    cant_verify_clause_count: int


class ReconciliationCounts(BaseModel):
    SURVIVED:                       int
    LEGITIMATELY_REMOVED_DUPLICATE: int
    UNEXPLAINED_LOSS:               int
    NEW_ENTITY:                     int


class ConsistencyCheck(BaseModel):
    input_total:     int
    accounted_total: int
    is_balanced:     bool


class Reconciliation(BaseModel):
    entity_key:        str
    counts:            ReconciliationCounts
    consistency_check: ConsistencyCheck


class ClauseResult(BaseModel):
    clause_id:         str
    type:              str
    label:             str
    status:            ClauseResultStatus
    verification_mode: Literal["DETERMINISTIC"] = "DETERMINISTIC"
    summary:           str
    counts:            dict[str, Any]
    evidence_refs:     list[str]


class ContractContext(BaseModel):
    clause_id:   str
    clause_type: str


class EvidenceRecord(BaseModel):
    id:               str
    kind:             EvidenceKind
    entity_key:       str | None
    before_row:       dict[str, Any] | None
    after_row:        dict[str, Any] | None
    contract_context: ContractContext
    explanation:      str


# ── Top-level response ────────────────────────────────────────────────────────

class VerificationResponse(BaseModel):
    run_id:             str
    contract_status:    Literal["APPROVED"] = "APPROVED"
    verification_mode:  Literal["DETERMINISTIC"] = "DETERMINISTIC"
    summary:            VerificationSummary
    reconciliation:     Reconciliation
    clause_results:     list[ClauseResult]
    evidence:           list[EvidenceRecord]
    highlighted_ids:    list[str]
    repair_instruction: str
    warnings:           list[str]
