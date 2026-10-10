"""
NO_NEW_ENTITY rule
No entity key may appear in `after` that was not present in `before`.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from app.utils.ids import unique_ids


@dataclass
class NoNewEntityResult:
    clause_id:   str
    label:       str
    new_ids:     set[str] = field(default_factory=set)
    passed:      bool = True

    @property
    def new_count(self) -> int:
        return len(self.new_ids)


def check_no_new_entity(
    before:    pd.DataFrame,
    after:     pd.DataFrame,
    clause_id: str,
    label:     str,
    key:       str,
) -> NoNewEntityResult:
    before_ids = unique_ids(before, key)
    after_ids  = unique_ids(after,  key)
    new_ids    = after_ids - before_ids

    return NoNewEntityResult(
        clause_id=clause_id,
        label=label,
        new_ids=new_ids,
        passed=len(new_ids) == 0,
    )
