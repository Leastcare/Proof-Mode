"""Normalization rule validators used by the NORMALIZE clause checker."""
from __future__ import annotations

import re
from app.models.contract import NormalizationRule


# One compiled regex per rule — checked against each cell value
_RULE_PATTERNS: dict[NormalizationRule, re.Pattern[str]] = {
    NormalizationRule.digits_only:     re.compile(r"^\d+$"),
    NormalizationRule.lowercase:       re.compile(r"^[^A-Z]*$"),   # no uppercase chars
    NormalizationRule.uppercase:       re.compile(r"^[^a-z]*$"),   # no lowercase chars
    NormalizationRule.trim_whitespace: re.compile(r"^\S.*\S$|^\S?$"),  # no leading/trailing space
}

_RULE_DESCRIPTIONS: dict[NormalizationRule, str] = {
    NormalizationRule.digits_only:     "must contain digits only",
    NormalizationRule.lowercase:       "must be lowercase",
    NormalizationRule.uppercase:       "must be uppercase",
    NormalizationRule.trim_whitespace: "must have no leading or trailing whitespace",
}


def value_passes_rule(value: str, rule: NormalizationRule) -> bool:
    """Return True if the string value satisfies the normalization rule."""
    if value is None or (isinstance(value, float)):
        # Null/NaN — normalization can't be checked on null; treat as pass
        # (NO_NEW_NULLS handles null introduction separately)
        return True
    s = str(value)
    if s == "" or s.lower() in ("nan", "none", "null", "<na>"):
        return True
    return bool(_RULE_PATTERNS[rule].fullmatch(s))


def rule_description(rule: NormalizationRule) -> str:
    return _RULE_DESCRIPTIONS.get(rule, str(rule))
