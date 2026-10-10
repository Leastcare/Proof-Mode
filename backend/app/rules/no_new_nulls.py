"""
NO_NEW_NULLS rule
The transformation must not introduce additional null/empty values
in the specified column.
"""
from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


def _null_count(df: pd.DataFrame, column: str) -> int:
    """Count nulls, empty strings, and 'nan'/'none' string representations."""
    col = df[column].astype(str).str.strip().str.lower()
    return int((col.isin(["", "nan", "none", "null", "<na>"]) | df[column].isna()).sum())


@dataclass
class NoNewNullsResult:
    clause_id:      str
    label:          str
    column:         str
    before_nulls:   int = 0
    after_nulls:    int = 0
    new_nulls:      int = 0
    passed:         bool = True


def check_no_new_nulls(
    before:    pd.DataFrame,
    after:     pd.DataFrame,
    clause_id: str,
    label:     str,
    column:    str,
) -> NoNewNullsResult:
    before_nulls = _null_count(before, column)
    after_nulls  = _null_count(after,  column)
    new_nulls    = max(0, after_nulls - before_nulls)

    return NoNewNullsResult(
        clause_id=clause_id,
        label=label,
        column=column,
        before_nulls=before_nulls,
        after_nulls=after_nulls,
        new_nulls=new_nulls,
        passed=new_nulls == 0,
    )
