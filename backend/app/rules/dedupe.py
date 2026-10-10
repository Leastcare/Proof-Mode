"""
DEDUPE rule
Duplicate rows by exact key may be removed.
Determines which IDs are legitimately removable (i.e. had duplicates)
and verifies that no more than the allowed count was removed per group.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from app.utils.ids import unique_ids


@dataclass
class DuplicateGroup:
    key_value:      str
    before_count:   int   # total occurrences in before
    after_count:    int   # occurrences in after (0 if completely removed)
    # Max legitimate removals = before_count - 1  (keep one)
    allowed_removals: int = 0
    actual_removals:  int = 0
    excess_removals:  int = 0


@dataclass
class DedupeResult:
    clause_id:   str
    label:       str
    # IDs that had duplicates in before — these are legitimately removable
    duplicate_ids:         set[str] = field(default_factory=set)
    # Groups detail
    groups:                list[DuplicateGroup] = field(default_factory=list)
    total_allowed:         int = 0
    total_actual_removed:  int = 0
    excess_removed_count:  int = 0
    passed:                bool = True


def check_dedupe(
    before:    pd.DataFrame,
    after:     pd.DataFrame,
    clause_id: str,
    label:     str,
    key:       str,
) -> DedupeResult:
    before_counts = before[key].astype(str).value_counts()
    after_counts  = after[key].astype(str).value_counts() if key in after.columns else pd.Series(dtype=int)

    duplicate_ids: set[str] = set()
    groups: list[DuplicateGroup] = []
    total_allowed   = 0
    total_actual    = 0
    excess_total    = 0

    for key_val, b_count in before_counts.items():
        if b_count < 2:
            continue  # not a duplicate — skip

        duplicate_ids.add(str(key_val))
        a_count       = int(after_counts.get(key_val, 0))
        allowed       = b_count - 1          # keep exactly one
        actual_rem    = b_count - a_count    # how many were actually removed
        # excess: removed more than duplicates warranted, or removed the last one
        excess        = max(0, actual_rem - allowed)

        groups.append(DuplicateGroup(
            key_value=str(key_val),
            before_count=b_count,
            after_count=a_count,
            allowed_removals=allowed,
            actual_removals=actual_rem,
            excess_removals=excess,
        ))
        total_allowed += allowed
        total_actual  += actual_rem
        excess_total  += excess

    return DedupeResult(
        clause_id=clause_id,
        label=label,
        duplicate_ids=duplicate_ids,
        groups=groups,
        total_allowed=total_allowed,
        total_actual_removed=total_actual,
        excess_removed_count=excess_total,
        passed=excess_total == 0,
    )
