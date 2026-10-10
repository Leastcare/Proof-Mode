"""
UNCHANGED_COLUMN rule
For all entities that survive in both before and after,
the protected column value must be identical.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd


@dataclass
class ColumnChange:
    entity_key:   str
    before_value: str
    after_value:  str


@dataclass
class UnchangedColumnResult:
    clause_id:     str
    label:         str
    column:        str
    entity_key:    str
    total_checked: int = 0
    changes:       list[ColumnChange] = field(default_factory=list)
    passed:        bool = True

    @property
    def change_count(self) -> int:
        return len(self.changes)


def check_unchanged_column(
    before:     pd.DataFrame,
    after:      pd.DataFrame,
    clause_id:  str,
    label:      str,
    column:     str,
    entity_key: str,
) -> UnchangedColumnResult:
    # Inner join on entity_key to get only surviving entities
    before_keyed = before[[entity_key, column]].copy()
    after_keyed  = after[[entity_key, column]].copy()

    before_keyed[entity_key] = before_keyed[entity_key].astype(str)
    after_keyed[entity_key]  = after_keyed[entity_key].astype(str)

    # Take the last occurrence for each key in before (deduped already in after)
    before_deduped = before_keyed.drop_duplicates(subset=[entity_key], keep="last")
    after_deduped  = after_keyed.drop_duplicates(subset=[entity_key], keep="last")

    merged = before_deduped.merge(
        after_deduped,
        on=entity_key,
        suffixes=("_before", "_after"),
    )

    col_before = f"{column}_before"
    col_after  = f"{column}_after"

    changes: list[ColumnChange] = []
    for _, row in merged.iterrows():
        b_val = str(row[col_before]) if row[col_before] is not None else ""
        a_val = str(row[col_after])  if row[col_after]  is not None else ""
        if b_val != a_val:
            changes.append(ColumnChange(
                entity_key=str(row[entity_key]),
                before_value=b_val,
                after_value=a_val,
            ))

    return UnchangedColumnResult(
        clause_id=clause_id,
        label=label,
        column=column,
        entity_key=entity_key,
        total_checked=len(merged),
        changes=changes,
        passed=len(changes) == 0,
    )
