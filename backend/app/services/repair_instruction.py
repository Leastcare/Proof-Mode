"""
Repair instruction generator.

Produces a plain-text repair instruction based on failed clause results
and the reconciliation summary. ProofMode does NOT auto-repair; it gives
the user a precise instruction to send to their AI tool.
"""
from __future__ import annotations

from app.models.contract import Contract, ClauseType
from app.models.verification import VerificationResponse, ClauseResultStatus


def generate_repair_instruction(
    contract: Contract,
    result:   VerificationResponse,
) -> str:
    lines: list[str] = []
    summary = result.summary

    if summary.overall_status == "VERIFIED":
        return ""

    failed = [r for r in result.clause_results if r.status == ClauseResultStatus.FAILED]
    if not failed:
        return ""

    # ── Unexplained losses ────────────────────────────────────────────────────
    if summary.unexplained_losses > 0:
        key = contract.entity_key or "the entity key"
        highlighted = result.highlighted_ids[:10]
        ids_str = ", ".join(highlighted)
        suffix = f" (including: {ids_str})" if ids_str else ""
        lines.append(
            f"Restore the {summary.unexplained_losses} missing "
            f"{key} records{suffix}."
        )
        lines.append("Do not modify any other records.")

    # ── Clause-specific instructions ─────────────────────────────────────────
    for clause_result in failed:
        # Find the clause in the contract
        matching = [c for c in contract.clauses if c.id == clause_result.clause_id]
        if not matching:
            continue
        clause = matching[0]

        if clause.type == ClauseType.NO_NEW_ENTITY:
            lines.append(
                f"Remove any {clause.params.key} values that were not present "   # type: ignore[union-attr]
                "in the original dataset."
            )
        elif clause.type == ClauseType.NORMALIZE:
            lines.append(
                f"Ensure all values in column '{clause.params.column}' "          # type: ignore[union-attr]
                f"conform to the '{clause.params.rule.value}' format."            # type: ignore[union-attr]
            )
        elif clause.type == ClauseType.NO_NEW_NULLS:
            lines.append(
                f"Restore any missing values in column '{clause.params.column}'." # type: ignore[union-attr]
            )
        elif clause.type == ClauseType.PRESERVE_SUM:
            lines.append(
                f"Ensure the total of column '{clause.params.column}' "           # type: ignore[union-attr]
                "matches the original dataset."
            )
        elif clause.type == ClauseType.UNCHANGED_COLUMN:
            lines.append(
                f"Revert any changes to column '{clause.params.column}' "         # type: ignore[union-attr]
                "for all surviving entities."
            )
        elif clause.type == ClauseType.ROW_COUNT_RANGE:
            lines.append(
                "Adjust the row count to fall within the approved range."
            )

    # ── Universal closing instructions ────────────────────────────────────────
    lines.append("Preserve all approved transformations.")
    if contract.entity_key:
        lines.append(
            f"Verify that every unique {contract.entity_key} from the "
            "original dataset exists in the corrected output."
        )
    lines.append("Keep the same column structure and formats.")

    return "\n".join(lines)
