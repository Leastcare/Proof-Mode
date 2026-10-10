"""
Orchestrator verifier service.

Receives an approved Contract and two DataFrames (before, after),
runs all relevant rule checkers, builds reconciliation + evidence,
generates repair instruction, and returns a VerificationResponse.
"""
from __future__ import annotations

import uuid
from datetime import datetime

import pandas as pd

from app.models.contract import Contract, ClauseType
from app.models.verification import (
    VerificationResponse,
    VerificationSummary,
    Reconciliation,
    ReconciliationCounts,
    ConsistencyCheck,
    ClauseResult,
    ClauseResultStatus,
    EvidenceRecord,
    OverallStatus,
)
from app.utils.csv_io import validate_contract_columns

# Rule checkers
from app.rules.preserve_entity  import check_preserve_entity
from app.rules.dedupe            import check_dedupe
from app.rules.no_new_entity     import check_no_new_entity
from app.rules.normalize         import check_normalize
from app.rules.no_new_nulls      import check_no_new_nulls
from app.rules.preserve_sum      import check_preserve_sum
from app.rules.unchanged_column  import check_unchanged_column
from app.rules.row_count_range   import check_row_count_range

# Services
from app.services.reconciliation   import build_reconciliation
from app.services.evidence_builder import (
    evidence_from_preserve_entity,
    evidence_from_dedupe,
    evidence_from_no_new_entity,
    evidence_from_normalize,
    evidence_from_no_new_nulls,
    evidence_from_preserve_sum,
    evidence_from_unchanged_column,
    evidence_from_row_count_range,
)
from app.services.repair_instruction import generate_repair_instruction


def run_verification(
    before:   pd.DataFrame,
    after:    pd.DataFrame,
    contract: Contract,
) -> VerificationResponse:
    """
    Full deterministic verification pipeline.
    Raises HTTP 422 for structural problems (missing columns etc.).
    """
    # ── Collect all columns referenced by clauses ─────────────────────────────
    clause_columns: list[str] = []
    for clause in contract.clauses:
        p = clause.params
        if hasattr(p, "key"):
            clause_columns.append(p.key)      # type: ignore[union-attr]
        if hasattr(p, "column"):
            clause_columns.append(p.column)   # type: ignore[union-attr]

    validate_contract_columns(before, after, contract.entity_key, clause_columns)

    # ── Run DEDUPE first — its results feed PRESERVE_ENTITY ───────────────────
    dedupe_result = None
    legitimately_removed: set[str] = set()

    for clause in contract.clauses:
        if clause.type == ClauseType.DEDUPE:
            dedupe_result = check_dedupe(
                before, after,
                clause_id=clause.id,
                label=clause.label,
                key=clause.params.key,  # type: ignore[union-attr]
            )
            legitimately_removed = dedupe_result.duplicate_ids
            break

    # ── Run all clauses ───────────────────────────────────────────────────────
    clause_results:  list[ClauseResult]  = []
    all_evidence:    list[EvidenceRecord] = []
    warnings:        list[str]           = []

    preserve_entity_result = None

    for clause in contract.clauses:
        p = clause.params

        # ── PRESERVE_ENTITY ──────────────────────────────────────────────────
        if clause.type == ClauseType.PRESERVE_ENTITY:
            r = check_preserve_entity(
                before, after,
                clause_id=clause.id,
                label=clause.label,
                key=p.key,                          # type: ignore[union-attr]
                legitimately_removed=legitimately_removed,
            )
            preserve_entity_result = r
            ev = evidence_from_preserve_entity(r, before, p.key)  # type: ignore[union-attr]
            all_evidence.extend(ev)
            clause_results.append(ClauseResult(
                clause_id=clause.id,
                type=clause.type.value,
                label=clause.label,
                status=ClauseResultStatus.VERIFIED if r.passed else ClauseResultStatus.FAILED,
                summary=(
                    f"All {len(r.before_unique_ids):,} unique entities preserved."
                    if r.passed else
                    f"{r.missing_count:,} entity key(s) absent from transformed file "
                    "without valid explanation."
                ),
                counts={"missing_entities": r.missing_count,
                        "before_unique": len(r.before_unique_ids)},
                evidence_refs=[e.id for e in ev],
            ))

        # ── DEDUPE ───────────────────────────────────────────────────────────
        elif clause.type == ClauseType.DEDUPE:
            r = dedupe_result  # already computed above
            ev = evidence_from_dedupe(r, before, after, p.key)  # type: ignore[union-attr]
            all_evidence.extend(ev)
            clause_results.append(ClauseResult(
                clause_id=clause.id,
                type=clause.type.value,
                label=clause.label,
                status=ClauseResultStatus.VERIFIED if r.passed else ClauseResultStatus.FAILED,
                summary=(
                    f"{r.total_actual_removed:,} duplicate record(s) removed; "
                    "all accounted for by exact-key duplicate groups."
                    if r.passed else
                    f"{r.excess_removed_count:,} record(s) removed beyond allowed duplicates."
                ),
                counts={"duplicate_groups": len(r.groups),
                        "records_removed": r.total_actual_removed,
                        "excess_removed":  r.excess_removed_count},
                evidence_refs=[e.id for e in ev],
            ))

        # ── NO_NEW_ENTITY ────────────────────────────────────────────────────
        elif clause.type == ClauseType.NO_NEW_ENTITY:
            r = check_no_new_entity(
                before, after,
                clause_id=clause.id,
                label=clause.label,
                key=p.key,                          # type: ignore[union-attr]
            )
            ev = evidence_from_no_new_entity(r, after, p.key)  # type: ignore[union-attr]
            all_evidence.extend(ev)
            clause_results.append(ClauseResult(
                clause_id=clause.id,
                type=clause.type.value,
                label=clause.label,
                status=ClauseResultStatus.VERIFIED if r.passed else ClauseResultStatus.FAILED,
                summary=(
                    "No new entity keys introduced."
                    if r.passed else
                    f"{r.new_count:,} new entity key(s) found in transformed file."
                ),
                counts={"new_entities": r.new_count},
                evidence_refs=[e.id for e in ev],
            ))

        # ── NORMALIZE ────────────────────────────────────────────────────────
        elif clause.type == ClauseType.NORMALIZE:
            r = check_normalize(
                after,
                clause_id=clause.id,
                label=clause.label,
                column=p.column,                    # type: ignore[union-attr]
                rule=p.rule,                        # type: ignore[union-attr]
            )
            ev = evidence_from_normalize(r)
            all_evidence.extend(ev)
            clause_results.append(ClauseResult(
                clause_id=clause.id,
                type=clause.type.value,
                label=clause.label,
                status=ClauseResultStatus.VERIFIED if r.passed else ClauseResultStatus.FAILED,
                summary=(
                    f"All {r.total_checked:,} values in '{p.column}' pass '{p.rule.value}'."  # type: ignore[union-attr]
                    if r.passed else
                    f"{r.fail_count:,} value(s) in '{p.column}' fail '{p.rule.value}'."  # type: ignore[union-attr]
                ),
                counts={"checked": r.total_checked, "failed": r.fail_count},
                evidence_refs=[e.id for e in ev],
            ))

        # ── NO_NEW_NULLS ─────────────────────────────────────────────────────
        elif clause.type == ClauseType.NO_NEW_NULLS:
            r = check_no_new_nulls(
                before, after,
                clause_id=clause.id,
                label=clause.label,
                column=p.column,                    # type: ignore[union-attr]
            )
            ev = evidence_from_no_new_nulls(r)
            all_evidence.extend(ev)
            clause_results.append(ClauseResult(
                clause_id=clause.id,
                type=clause.type.value,
                label=clause.label,
                status=ClauseResultStatus.VERIFIED if r.passed else ClauseResultStatus.FAILED,
                summary=(
                    f"No new nulls in '{p.column}'."  # type: ignore[union-attr]
                    if r.passed else
                    f"{r.new_nulls:,} new null(s) introduced in '{p.column}'."  # type: ignore[union-attr]
                ),
                counts={"before_nulls": r.before_nulls, "after_nulls": r.after_nulls,
                        "new_nulls": r.new_nulls},
                evidence_refs=[e.id for e in ev],
            ))

        # ── PRESERVE_SUM ─────────────────────────────────────────────────────
        elif clause.type == ClauseType.PRESERVE_SUM:
            r = check_preserve_sum(
                before, after,
                clause_id=clause.id,
                label=clause.label,
                column=p.column,                    # type: ignore[union-attr]
                tolerance_type=p.tolerance_type,    # type: ignore[union-attr]
                tolerance_value=p.tolerance_value,  # type: ignore[union-attr]
            )
            ev = evidence_from_preserve_sum(r)
            all_evidence.extend(ev)
            clause_results.append(ClauseResult(
                clause_id=clause.id,
                type=clause.type.value,
                label=clause.label,
                status=ClauseResultStatus.VERIFIED if r.passed else ClauseResultStatus.FAILED,
                summary=(
                    f"Sum of '{p.column}' preserved within tolerance."  # type: ignore[union-attr]
                    if r.passed else
                    f"Sum of '{p.column}' changed by {r.difference:.4f} "  # type: ignore[union-attr]
                    f"(tolerance: {p.tolerance_value} {p.tolerance_type.value})."  # type: ignore[union-attr]
                ),
                counts={"before_sum": r.before_sum, "after_sum": r.after_sum,
                        "difference": r.difference},
                evidence_refs=[e.id for e in ev],
            ))

        # ── UNCHANGED_COLUMN ─────────────────────────────────────────────────
        elif clause.type == ClauseType.UNCHANGED_COLUMN:
            if not contract.entity_key:
                warnings.append(
                    f"UNCHANGED_COLUMN clause '{clause.id}' skipped: entity_key not defined."
                )
                clause_results.append(ClauseResult(
                    clause_id=clause.id, type=clause.type.value, label=clause.label,
                    status=ClauseResultStatus.CANT_VERIFY,
                    summary="Cannot verify: entity key is not defined.",
                    counts={}, evidence_refs=[],
                ))
                continue
            r = check_unchanged_column(
                before, after,
                clause_id=clause.id,
                label=clause.label,
                column=p.column,                    # type: ignore[union-attr]
                entity_key=contract.entity_key,
            )
            ev = evidence_from_unchanged_column(r)
            all_evidence.extend(ev)
            clause_results.append(ClauseResult(
                clause_id=clause.id,
                type=clause.type.value,
                label=clause.label,
                status=ClauseResultStatus.VERIFIED if r.passed else ClauseResultStatus.FAILED,
                summary=(
                    f"All {r.total_checked:,} values in '{p.column}' unchanged."  # type: ignore[union-attr]
                    if r.passed else
                    f"{r.change_count:,} value(s) in '{p.column}' changed for surviving entities."  # type: ignore[union-attr]
                ),
                counts={"checked": r.total_checked, "changed": r.change_count},
                evidence_refs=[e.id for e in ev],
            ))

        # ── ROW_COUNT_RANGE ──────────────────────────────────────────────────
        elif clause.type == ClauseType.ROW_COUNT_RANGE:
            r = check_row_count_range(
                before, after,
                clause_id=clause.id,
                label=clause.label,
                min_ratio=p.min_ratio,              # type: ignore[union-attr]
                max_ratio=p.max_ratio,              # type: ignore[union-attr]
            )
            ev = evidence_from_row_count_range(r)
            all_evidence.extend(ev)
            clause_results.append(ClauseResult(
                clause_id=clause.id,
                type=clause.type.value,
                label=clause.label,
                status=ClauseResultStatus.VERIFIED if r.passed else ClauseResultStatus.FAILED,
                summary=(
                    f"Row count ratio {r.actual_ratio:.4f} is within "
                    f"[{p.min_ratio}, {p.max_ratio}]."  # type: ignore[union-attr]
                    if r.passed else
                    f"Row count ratio {r.actual_ratio:.4f} is outside "
                    f"[{p.min_ratio}, {p.max_ratio}]."  # type: ignore[union-attr]
                ),
                counts={"before_count": r.before_count, "after_count": r.after_count,
                        "actual_ratio": r.actual_ratio},
                evidence_refs=[e.id for e in ev],
            ))

    # ── Reconciliation ────────────────────────────────────────────────────────
    recon = None
    explained_removals = 0
    unexplained_losses = 0
    new_entities       = 0

    if contract.entity_key:
        recon = build_reconciliation(
            before, after,
            entity_key=contract.entity_key,
            duplicate_ids=legitimately_removed,
        )
        # explained_removals = actual duplicate rows removed (row count, not unique IDs)
        explained_removals = dedupe_result.total_actual_removed if dedupe_result else len(recon.duplicate_ids)
        unexplained_losses = len(recon.unexplained_ids)
        new_entities       = len(recon.new_entity_ids)
    elif preserve_entity_result:
        unexplained_losses = preserve_entity_result.missing_count

    # ── Summary ───────────────────────────────────────────────────────────────
    n_verified    = sum(1 for r in clause_results if r.status == ClauseResultStatus.VERIFIED)
    n_failed      = sum(1 for r in clause_results if r.status == ClauseResultStatus.FAILED)
    n_cant_verify = sum(1 for r in clause_results if r.status == ClauseResultStatus.CANT_VERIFY)

    if n_failed > 0:
        overall = OverallStatus.FAILED
    elif n_cant_verify > 0 and n_verified == 0:
        overall = OverallStatus.CANT_VERIFY
    else:
        overall = OverallStatus.VERIFIED

    summary = VerificationSummary(
        overall_status=overall,
        before_row_count=len(before),
        after_row_count=len(after),
        surviving_rows=len(after),
        explained_removals=explained_removals,
        unexplained_losses=unexplained_losses,
        new_entities=new_entities,
        verified_clause_count=n_verified,
        failed_clause_count=n_failed,
        cant_verify_clause_count=n_cant_verify,
    )

    # ── Reconciliation response object ────────────────────────────────────────
    if recon:
        reconciliation = Reconciliation(
            entity_key=contract.entity_key,  # type: ignore[arg-type]
            counts=ReconciliationCounts(**recon.counts),
            consistency_check=ConsistencyCheck(
                input_total=len(before),
                accounted_total=recon.accounted_total,
                is_balanced=recon.is_balanced,
            ),
        )
    else:
        reconciliation = Reconciliation(
            entity_key=contract.entity_key or "unknown",
            counts=ReconciliationCounts(
                SURVIVED=len(after),
                LEGITIMATELY_REMOVED_DUPLICATE=0,
                UNEXPLAINED_LOSS=unexplained_losses,
                NEW_ENTITY=new_entities,
            ),
            consistency_check=ConsistencyCheck(
                input_total=len(before),
                accounted_total=len(after) + unexplained_losses,
                is_balanced=False,
            ),
        )

    # ── Highlighted IDs (first 10 unexplained) ────────────────────────────────
    highlighted: list[str] = []
    if recon and recon.unexplained_ids:
        highlighted = sorted(recon.unexplained_ids)[:10]
    elif preserve_entity_result and preserve_entity_result.unexplained_ids:
        highlighted = sorted(preserve_entity_result.unexplained_ids)[:10]

    # ── Build response, generate repair instruction ───────────────────────────
    response = VerificationResponse(
        run_id=f"verify_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}",
        summary=summary,
        reconciliation=reconciliation,
        clause_results=clause_results,
        evidence=all_evidence,
        highlighted_ids=highlighted,
        repair_instruction="",
        warnings=warnings,
    )
    response.repair_instruction = generate_repair_instruction(contract, response)
    return response
