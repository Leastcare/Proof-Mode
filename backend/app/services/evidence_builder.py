"""
Evidence builder.

Converts raw rule results into UI-ready EvidenceRecord objects.
Each record has a stable ID, kind, before/after rows, and an explanation.
"""
from __future__ import annotations

import itertools
from typing import Any

import pandas as pd

from app.models.verification import EvidenceRecord, ContractContext, EvidenceKind
from app.rules.preserve_entity  import PreserveEntityResult
from app.rules.dedupe            import DedupeResult
from app.rules.no_new_entity     import NoNewEntityResult
from app.rules.normalize         import NormalizeResult
from app.rules.no_new_nulls      import NoNewNullsResult
from app.rules.preserve_sum      import PreserveSumResult
from app.rules.unchanged_column  import UnchangedColumnResult
from app.rules.row_count_range   import RowCountRangeResult


# Maximum evidence records to emit per clause (prevents enormous payloads)
MAX_PER_CLAUSE = 100


def _row_by_key(df: pd.DataFrame, key_col: str, key_val: str) -> dict[str, Any] | None:
    """Return the first matching row as a string dict, or None."""
    matches = df[df[key_col].astype(str) == key_val]
    if matches.empty:
        return None
    return {k: str(v) for k, v in matches.iloc[0].to_dict().items()}


# ── Per-rule builders ─────────────────────────────────────────────────────────

def evidence_from_preserve_entity(
    result: PreserveEntityResult,
    before: pd.DataFrame,
    entity_key: str,
) -> list[EvidenceRecord]:
    records = []
    for i, eid in enumerate(itertools.islice(sorted(result.unexplained_ids), MAX_PER_CLAUSE)):
        records.append(EvidenceRecord(
            id=f"ev_{result.clause_id}_{i:04d}",
            kind=EvidenceKind.missing_id,
            entity_key=eid,
            before_row=_row_by_key(before, entity_key, eid),
            after_row=None,
            contract_context=ContractContext(
                clause_id=result.clause_id,
                clause_type="PRESERVE_ENTITY",
            ),
            explanation=(
                f"Record '{eid}' exists in the original dataset but is absent "
                "from the transformed dataset and is not part of a valid duplicate removal."
            ),
        ))
    return records


def evidence_from_dedupe(
    result: DedupeResult,
    before: pd.DataFrame,
    after:  pd.DataFrame,
    entity_key: str,
) -> list[EvidenceRecord]:
    records = []
    for i, group in enumerate(itertools.islice(result.groups, MAX_PER_CLAUSE)):
        records.append(EvidenceRecord(
            id=f"ev_{result.clause_id}_{i:04d}",
            kind=EvidenceKind.duplicate_group,
            entity_key=group.key_value,
            before_row=_row_by_key(before, entity_key, group.key_value),
            after_row=_row_by_key(after,  entity_key, group.key_value),
            contract_context=ContractContext(
                clause_id=result.clause_id,
                clause_type="DEDUPE",
            ),
            explanation=(
                f"'{group.key_value}' had {group.before_count} records in the original. "
                f"{group.actual_removals} removed (max allowed: {group.allowed_removals}). "
                "Duplicate removal is permitted by the approved DEDUPE clause."
            ),
        ))
    return records


def evidence_from_no_new_entity(
    result: NoNewEntityResult,
    after:  pd.DataFrame,
    entity_key: str,
) -> list[EvidenceRecord]:
    records = []
    for i, eid in enumerate(itertools.islice(sorted(result.new_ids), MAX_PER_CLAUSE)):
        records.append(EvidenceRecord(
            id=f"ev_{result.clause_id}_{i:04d}",
            kind=EvidenceKind.new_id,
            entity_key=eid,
            before_row=None,
            after_row=_row_by_key(after, entity_key, eid),
            contract_context=ContractContext(
                clause_id=result.clause_id,
                clause_type="NO_NEW_ENTITY",
            ),
            explanation=(
                f"Entity key '{eid}' appears in the transformed file "
                "but was not present in the original dataset."
            ),
        ))
    return records


def evidence_from_normalize(result: NormalizeResult) -> list[EvidenceRecord]:
    records = []
    for i, row in enumerate(itertools.islice(result.failing_rows, MAX_PER_CLAUSE)):
        records.append(EvidenceRecord(
            id=f"ev_{result.clause_id}_{i:04d}",
            kind=EvidenceKind.invalid_format,
            entity_key=None,
            before_row=None,
            after_row=row,
            contract_context=ContractContext(
                clause_id=result.clause_id,
                clause_type="NORMALIZE",
            ),
            explanation=(
                f"Column '{result.column}' value '{row.get(result.column, '')}' "
                f"does not satisfy rule '{result.rule.value}'."
            ),
        ))
    return records


def evidence_from_no_new_nulls(result: NoNewNullsResult) -> list[EvidenceRecord]:
    if result.passed:
        return []
    return [EvidenceRecord(
        id=f"ev_{result.clause_id}_0000",
        kind=EvidenceKind.null_increase,
        entity_key=None,
        before_row=None,
        after_row=None,
        contract_context=ContractContext(
            clause_id=result.clause_id,
            clause_type="NO_NEW_NULLS",
        ),
        explanation=(
            f"Column '{result.column}' had {result.before_nulls} null(s) in the original "
            f"and {result.after_nulls} null(s) in the transformed file. "
            f"{result.new_nulls} new null(s) introduced."
        ),
    )]


def evidence_from_preserve_sum(result: PreserveSumResult) -> list[EvidenceRecord]:
    if result.passed:
        return []
    return [EvidenceRecord(
        id=f"ev_{result.clause_id}_0000",
        kind=EvidenceKind.aggregate_mismatch,
        entity_key=None,
        before_row={"sum": str(result.before_sum)},
        after_row={"sum": str(result.after_sum)},
        contract_context=ContractContext(
            clause_id=result.clause_id,
            clause_type="PRESERVE_SUM",
        ),
        explanation=(
            f"Column '{result.column}' sum changed from {result.before_sum:.4f} "
            f"to {result.after_sum:.4f} (difference: {result.difference:.4f}, "
            f"tolerance: {result.tolerance_value} {result.tolerance_type.value})."
        ),
    )]


def evidence_from_unchanged_column(result: UnchangedColumnResult) -> list[EvidenceRecord]:
    records = []
    for i, change in enumerate(itertools.islice(result.changes, MAX_PER_CLAUSE)):
        records.append(EvidenceRecord(
            id=f"ev_{result.clause_id}_{i:04d}",
            kind=EvidenceKind.column_change,
            entity_key=change.entity_key,
            before_row={result.column: change.before_value},
            after_row={result.column: change.after_value},
            contract_context=ContractContext(
                clause_id=result.clause_id,
                clause_type="UNCHANGED_COLUMN",
            ),
            explanation=(
                f"Entity '{change.entity_key}': column '{result.column}' changed "
                f"from '{change.before_value}' to '{change.after_value}'."
            ),
        ))
    return records


def evidence_from_row_count_range(result: RowCountRangeResult) -> list[EvidenceRecord]:
    if result.passed:
        return []
    return [EvidenceRecord(
        id=f"ev_{result.clause_id}_0000",
        kind=EvidenceKind.row_count_violation,
        entity_key=None,
        before_row={"row_count": str(result.before_count)},
        after_row={"row_count": str(result.after_count), "ratio": str(result.actual_ratio)},
        contract_context=ContractContext(
            clause_id=result.clause_id,
            clause_type="ROW_COUNT_RANGE",
        ),
        explanation=(
            f"Row count ratio {result.actual_ratio:.4f} is outside "
            f"the allowed range [{result.min_ratio}, {result.max_ratio}]."
        ),
    )]
