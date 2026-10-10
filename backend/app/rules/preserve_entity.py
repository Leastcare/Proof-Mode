"""
PRESERVE_ENTITY rule
Every unique entity key in `before` must exist in `after`,
unless removal is explained by an approved DEDUPE clause.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from app.utils.ids import unique_ids


@dataclass
class PreserveEntityResult:
    clause_id:            str
    label:                str
    before_unique_ids:    set[str]
    after_ids:            set[str]
    # IDs that are in before but absent from after (before dedup accounting)
    raw_missing_ids:      set[str] = field(default_factory=set)
    # IDs still unexplained after dedup credit is applied
    unexplained_ids:      set[str] = field(default_factory=set)
    passed:               bool = True

    @property
    def missing_count(self) -> int:
        return len(self.unexplained_ids)


def check_preserve_entity(
    before: pd.DataFrame,
    after:  pd.DataFrame,
    clause_id: str,
    label: str,
    key: str,
    # Set of IDs that were legitimately removed by an approved DEDUPE clause
    legitimately_removed: set[str] | None = None,
) -> PreserveEntityResult:
    before_unique = unique_ids(before, key)
    after_ids     = unique_ids(after,  key)
    raw_missing   = before_unique - after_ids

    allowed = legitimately_removed or set()
    # An ID is unexplained if it's absent AND not covered by a dedup removal
    unexplained = raw_missing - allowed

    return PreserveEntityResult(
        clause_id=clause_id,
        label=label,
        before_unique_ids=before_unique,
        after_ids=after_ids,
        raw_missing_ids=raw_missing,
        unexplained_ids=unexplained,
        passed=len(unexplained) == 0,
    )
