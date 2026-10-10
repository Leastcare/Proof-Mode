"""
ROW_COUNT_RANGE rule
The output row count must be within a specified ratio range of the input.
"""
from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass
class RowCountRangeResult:
    clause_id:    str
    label:        str
    before_count: int   = 0
    after_count:  int   = 0
    actual_ratio: float = 0.0
    min_ratio:    float = 0.0
    max_ratio:    float = 1.0
    passed:       bool  = True


def check_row_count_range(
    before:    pd.DataFrame,
    after:     pd.DataFrame,
    clause_id: str,
    label:     str,
    min_ratio: float,
    max_ratio: float,
) -> RowCountRangeResult:
    before_count = len(before)
    after_count  = len(after)
    actual_ratio = after_count / before_count if before_count > 0 else 0.0
    passed       = min_ratio <= actual_ratio <= max_ratio

    return RowCountRangeResult(
        clause_id=clause_id,
        label=label,
        before_count=before_count,
        after_count=after_count,
        actual_ratio=round(actual_ratio, 6),
        min_ratio=min_ratio,
        max_ratio=max_ratio,
        passed=passed,
    )
