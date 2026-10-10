"""
Reconciliation service.

Assigns every entity from `before` into exactly one of four categories:
  SURVIVED                       — present in after
  LEGITIMATELY_REMOVED_DUPLICATE — duplicate in before, absent in after,
                                   explained by an approved DEDUPE clause
  UNEXPLAINED_LOSS               — absent in after, no valid explanation
  NEW_ENTITY                     — present in after but not in before

The categories are mutually exclusive and exhaustive — the totals must balance.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from app.utils.ids import unique_ids


@dataclass
class ReconciliationResult:
    entity_key:          str
    before_total:        int
    after_total:         int

    survived_ids:        set[str] = field(default_factory=set)
    duplicate_ids:       set[str] = field(default_factory=set)   # legitimately removed
    unexplained_ids:     set[str] = field(default_factory=set)
    new_entity_ids:      set[str] = field(default_factory=set)

    @property
    def counts(self) -> dict[str, int]:
        return {
            "SURVIVED":                       len(self.survived_ids),
            "LEGITIMATELY_REMOVED_DUPLICATE": len(self.duplicate_ids),
            "UNEXPLAINED_LOSS":               len(self.unexplained_ids),
            "NEW_ENTITY":                     len(self.new_entity_ids),
        }

    @property
    def accounted_total(self) -> int:
        return (
            len(self.survived_ids)
            + len(self.duplicate_ids)
            + len(self.unexplained_ids)
            + len(self.new_entity_ids)
        )

    @property
    def is_balanced(self) -> bool:
        """
        Balanced means: unique before IDs + new entity IDs == sum of all buckets.
        (Duplicates in before are counted once as unique IDs.)
        """
        before_unique = len(self.survived_ids | self.duplicate_ids | self.unexplained_ids)
        return (before_unique + len(self.new_entity_ids)) == self.accounted_total


def build_reconciliation(
    before:        pd.DataFrame,
    after:         pd.DataFrame,
    entity_key:    str,
    # IDs with duplicates in before (from DedupeResult.duplicate_ids)
    duplicate_ids: set[str] | None = None,
) -> ReconciliationResult:
    before_unique = unique_ids(before, entity_key)
    after_ids     = unique_ids(after,  entity_key)
    dup_ids       = duplicate_ids or set()

    survived     = before_unique & after_ids
    missing      = before_unique - after_ids
    new_entities = after_ids - before_unique

    # Of the missing IDs, those that had duplicates in before are legitimately removed
    legit_removed = missing & dup_ids
    unexplained   = missing - dup_ids

    return ReconciliationResult(
        entity_key=entity_key,
        before_total=len(before),
        after_total=len(after),
        survived_ids=survived,
        duplicate_ids=legit_removed,
        unexplained_ids=unexplained,
        new_entity_ids=new_entities,
    )
