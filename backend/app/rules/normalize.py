"""
NORMALIZE rule
Every non-null value in the target column of `after` must conform
to the specified normalization rule.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from app.models.contract import NormalizationRule
from app.utils.regex_rules import value_passes_rule, rule_description


@dataclass
class NormalizeResult:
    clause_id:       str
    label:           str
    column:          str
    rule:            NormalizationRule
    total_checked:   int = 0
    failing_indices: list[int] = field(default_factory=list)
    failing_rows:    list[dict] = field(default_factory=list)
    passed:          bool = True

    @property
    def fail_count(self) -> int:
        return len(self.failing_indices)


def check_normalize(
    after:     pd.DataFrame,
    clause_id: str,
    label:     str,
    column:    str,
    rule:      NormalizationRule,
) -> NormalizeResult:
    failing_indices: list[int] = []
    failing_rows:    list[dict] = []

    col_series = after[column]
    for idx, val in col_series.items():
        str_val = "" if (val is None or (isinstance(val, float))) else str(val)
        # skip nulls — NO_NEW_NULLS handles those
        if str_val == "" or str_val.lower() in ("nan", "none", "null", "<na>"):
            continue
        if not value_passes_rule(str_val, rule):
            failing_indices.append(int(idx))  # type: ignore[arg-type]
            row = after.loc[idx].to_dict()  # type: ignore[call-overload]
            failing_rows.append({k: str(v) for k, v in row.items()})

    return NormalizeResult(
        clause_id=clause_id,
        label=label,
        column=column,
        rule=rule,
        total_checked=len(col_series),
        failing_indices=failing_indices,
        failing_rows=failing_rows,
        passed=len(failing_indices) == 0,
    )
