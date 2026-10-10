"""
PRESERVE_SUM rule
The aggregate sum of a numeric column must remain unchanged,
within an explicit tolerance (absolute or percentage).
"""
from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from app.models.contract import ToleranceType


@dataclass
class PreserveSumResult:
    clause_id:       str
    label:           str
    column:          str
    before_sum:      float = 0.0
    after_sum:       float = 0.0
    difference:      float = 0.0
    tolerance_type:  ToleranceType = ToleranceType.absolute
    tolerance_value: float = 0.0
    within_tolerance: bool = True
    passed:          bool = True


def _to_numeric(df: pd.DataFrame, column: str) -> pd.Series:
    return pd.to_numeric(df[column], errors="coerce")


def check_preserve_sum(
    before:          pd.DataFrame,
    after:           pd.DataFrame,
    clause_id:       str,
    label:           str,
    column:          str,
    tolerance_type:  ToleranceType,
    tolerance_value: float,
) -> PreserveSumResult:
    before_sum = float(_to_numeric(before, column).sum())
    after_sum  = float(_to_numeric(after,  column).sum())
    difference = abs(after_sum - before_sum)

    if tolerance_type == ToleranceType.absolute:
        within = difference <= tolerance_value
    else:  # percentage
        if before_sum == 0:
            within = difference == 0
        else:
            within = (difference / abs(before_sum)) * 100 <= tolerance_value

    return PreserveSumResult(
        clause_id=clause_id,
        label=label,
        column=column,
        before_sum=before_sum,
        after_sum=after_sum,
        difference=difference,
        tolerance_type=tolerance_type,
        tolerance_value=tolerance_value,
        within_tolerance=within,
        passed=within,
    )
