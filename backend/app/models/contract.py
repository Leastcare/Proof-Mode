from __future__ import annotations
from enum import Enum
from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────────────────

class ClauseType(str, Enum):
    PRESERVE_ENTITY  = "PRESERVE_ENTITY"
    DEDUPE           = "DEDUPE"
    NO_NEW_ENTITY    = "NO_NEW_ENTITY"
    NORMALIZE        = "NORMALIZE"
    NO_NEW_NULLS     = "NO_NEW_NULLS"
    PRESERVE_SUM     = "PRESERVE_SUM"
    UNCHANGED_COLUMN = "UNCHANGED_COLUMN"
    ROW_COUNT_RANGE  = "ROW_COUNT_RANGE"


class NormalizationRule(str, Enum):
    digits_only     = "digits_only"
    lowercase       = "lowercase"
    uppercase       = "uppercase"
    trim_whitespace = "trim_whitespace"


class ContractStatus(str, Enum):
    PROPOSED = "PROPOSED"
    APPROVED = "APPROVED"


class ToleranceType(str, Enum):
    absolute   = "absolute"
    percentage = "percentage"


# ── Clause params ─────────────────────────────────────────────────────────────

class PreserveEntityParams(BaseModel):
    key: str


class DedupeParams(BaseModel):
    key: str


class NoNewEntityParams(BaseModel):
    key: str


class NormalizeParams(BaseModel):
    column: str
    rule: NormalizationRule


class NoNewNullsParams(BaseModel):
    column: str


class PreserveSumParams(BaseModel):
    column: str
    tolerance_type:  ToleranceType = ToleranceType.absolute
    tolerance_value: float = 0.0


class UnchangedColumnParams(BaseModel):
    column:   str
    apply_to: Literal["surviving_entities"] = "surviving_entities"


class RowCountRangeParams(BaseModel):
    min_ratio: float = Field(ge=0.0, le=1.0)
    max_ratio: float = Field(ge=0.0, le=2.0)


# ── Clauses (discriminated union on `type`) ───────────────────────────────────

class _ClauseBase(BaseModel):
    id:                        str
    label:                     str
    status_before_verification: Literal["PROPOSED"] = "PROPOSED"


class PreserveEntityClause(_ClauseBase):
    type:   Literal[ClauseType.PRESERVE_ENTITY] = ClauseType.PRESERVE_ENTITY
    params: PreserveEntityParams


class DedupeClause(_ClauseBase):
    type:   Literal[ClauseType.DEDUPE] = ClauseType.DEDUPE
    params: DedupeParams


class NoNewEntityClause(_ClauseBase):
    type:   Literal[ClauseType.NO_NEW_ENTITY] = ClauseType.NO_NEW_ENTITY
    params: NoNewEntityParams


class NormalizeClause(_ClauseBase):
    type:   Literal[ClauseType.NORMALIZE] = ClauseType.NORMALIZE
    params: NormalizeParams


class NoNewNullsClause(_ClauseBase):
    type:   Literal[ClauseType.NO_NEW_NULLS] = ClauseType.NO_NEW_NULLS
    params: NoNewNullsParams


class PreserveSumClause(_ClauseBase):
    type:   Literal[ClauseType.PRESERVE_SUM] = ClauseType.PRESERVE_SUM
    params: PreserveSumParams


class UnchangedColumnClause(_ClauseBase):
    type:   Literal[ClauseType.UNCHANGED_COLUMN] = ClauseType.UNCHANGED_COLUMN
    params: UnchangedColumnParams


class RowCountRangeClause(_ClauseBase):
    type:   Literal[ClauseType.ROW_COUNT_RANGE] = ClauseType.ROW_COUNT_RANGE
    params: RowCountRangeParams


Clause = Annotated[
    Union[
        PreserveEntityClause,
        DedupeClause,
        NoNewEntityClause,
        NormalizeClause,
        NoNewNullsClause,
        PreserveSumClause,
        UnchangedColumnClause,
        RowCountRangeClause,
    ],
    Field(discriminator="type"),
]


# ── Ambiguity ─────────────────────────────────────────────────────────────────

class Ambiguity(BaseModel):
    id:       str
    field:    str
    message:  str
    options:  list[str]
    required: bool = True
    resolved: str | None = None


# ── Top-level contract ────────────────────────────────────────────────────────

class Contract(BaseModel):
    version:        str           = "1.0"
    instruction:    str
    entity_key:     str | None    = None
    status:         ContractStatus = ContractStatus.PROPOSED
    clauses:        list[Clause]  = []
    ambiguities:    list[Ambiguity] = []
    compiler_notes: list[str]     = []

    model_config = {"json_schema_extra": {"example": {
        "version": "1.0",
        "instruction": "Remove duplicates. Normalize phone numbers.",
        "entity_key": "customer_id",
        "status": "PROPOSED",
        "clauses": [],
        "ambiguities": [],
        "compiler_notes": [],
    }}}
