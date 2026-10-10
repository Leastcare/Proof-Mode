"""
Contract compiler service.

Converts a plain-English transformation instruction into a structured
Contract object using a bounded, schema-validated prompt.

Rules:
- Only the 8 supported clause types may be emitted.
- No arbitrary code may be generated.
- Ambiguities must be surfaced rather than guessed.
- The LLM may NOT issue pass/fail verdicts.

Falls back to a rule-based heuristic compiler if no OpenAI key is configured.
"""
from __future__ import annotations

import json
import re
import uuid

from app.core.config import settings
from app.models.contract import (
    Contract,
    ContractStatus,
    ClauseType,
    NormalizationRule,
    PreserveEntityClause,   PreserveEntityParams,
    DedupeClause,           DedupeParams,
    NoNewEntityClause,      NoNewEntityParams,
    NormalizeClause,        NormalizeParams,
    NoNewNullsClause,       NoNewNullsParams,
    PreserveSumClause,      PreserveSumParams,
    UnchangedColumnClause,  UnchangedColumnParams,
    RowCountRangeClause,    RowCountRangeParams,
    Ambiguity,
)

# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """
You are the ProofMode contract compiler.
Your job is to convert a plain-English data transformation instruction
into a STRUCTURED JSON contract.

RULES (non-negotiable):
1. Only use these clause types: PRESERVE_ENTITY, DEDUPE, NO_NEW_ENTITY,
   NORMALIZE, NO_NEW_NULLS, PRESERVE_SUM, UNCHANGED_COLUMN, ROW_COUNT_RANGE.
2. Never output executable code, custom logic, or new clause types.
3. Never claim whether the transformation succeeded or failed.
4. If intent is ambiguous (e.g. "remove duplicates" without specifying the key),
   add an ambiguity object instead of guessing.
5. For NORMALIZE, only use these rules: digits_only, lowercase, uppercase, trim_whitespace.
6. Infer entity_key from column names if obvious (e.g. "customer_id", "id", "user_id").
   If uncertain, set entity_key to null and add an ambiguity.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "entity_key": "customer_id" | null,
  "clauses": [
    {
      "id": "clause_001",
      "type": "PRESERVE_ENTITY",
      "label": "short human-readable description",
      "status_before_verification": "PROPOSED",
      "params": { "key": "customer_id" }
    }
  ],
  "ambiguities": [
    {
      "id": "amb_001",
      "field": "dedupe.key",
      "message": "Which field identifies a duplicate?",
      "options": ["customer_id", "email"],
      "required": true
    }
  ],
  "compiler_notes": ["note about assumptions"]
}
""".strip()


# ── LLM-based compiler ────────────────────────────────────────────────────────

async def compile_with_llm(
    instruction: str,
    columns:     list[str],
) -> Contract:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    col_hint = f"Available columns: {', '.join(columns)}" if columns else ""
    user_msg = f"Instruction: {instruction}\n{col_hint}"

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0,
        max_tokens=1200,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    return _parse_compiler_output(raw, instruction)


# ── Rule-based fallback compiler ──────────────────────────────────────────────

def compile_heuristic(instruction: str, columns: list[str]) -> Contract:
    """
    Simple keyword-based compiler used when no OpenAI key is available.
    Conservative — only emits clauses it can be confident about.
    """
    text  = instruction.lower()
    notes: list[str] = []
    ambiguities: list[Ambiguity] = []
    clauses = []
    ctr = 1

    def cid() -> str:
        nonlocal ctr
        s = f"clause_{ctr:03d}"
        ctr += 1
        return s

    # Infer entity key
    key_candidates = [c for c in columns if c.lower() in (
        "customer_id", "id", "user_id", "client_id", "order_id",
        "product_id", "employee_id", "record_id",
    )]
    entity_key = key_candidates[0] if key_candidates else None
    if not entity_key and columns:
        # Prefer any column ending in _id
        id_cols = [c for c in columns if c.lower().endswith("_id")]
        entity_key = id_cols[0] if id_cols else None

    if not entity_key:
        ambiguities.append(Ambiguity(
            id="amb_001",
            field="entity_key",
            message="Which column uniquely identifies each record?",
            options=columns[:6] if columns else [],
            required=True,
        ))
    else:
        notes.append(f"Entity key inferred from column '{entity_key}'.")

    # PRESERVE_ENTITY
    preserve_kw = ["preserve", "keep every", "retain every", "don't lose", "do not lose",
                   "keep all", "every customer", "every record", "unique customer"]
    if any(kw in text for kw in preserve_kw) and entity_key:
        clauses.append(PreserveEntityClause(
            id=cid(), label=f"Preserve every unique {entity_key}.",
            params=PreserveEntityParams(key=entity_key),
        ))

    # DEDUPE
    dedup_kw = ["remove duplicate", "deduplicate", "dedupe", "remove dupe",
                "eliminate duplicate", "drop duplicate"]
    if any(kw in text for kw in dedup_kw):
        if entity_key:
            clauses.append(DedupeClause(
                id=cid(), label=f"Remove duplicate records by {entity_key}.",
                params=DedupeParams(key=entity_key),
            ))
        else:
            ambiguities.append(Ambiguity(
                id="amb_002",
                field="dedupe.key",
                message="Deduplicate by which field?",
                options=columns[:6] if columns else [],
                required=True,
            ))

    # NO_NEW_ENTITY
    no_new_kw = ["don't add", "do not add", "no new", "don't introduce",
                 "do not introduce", "no additional"]
    if any(kw in text for kw in no_new_kw) and entity_key:
        clauses.append(NoNewEntityClause(
            id=cid(), label=f"No new {entity_key} may be introduced.",
            params=NoNewEntityParams(key=entity_key),
        ))

    # NORMALIZE — phone
    phone_kw = ["normalize phone", "phone number", "phone format",
                "standardize phone", "digits only", "digits-only"]
    phone_cols = [c for c in columns if "phone" in c.lower()]
    if any(kw in text for kw in phone_kw):
        col = phone_cols[0] if phone_cols else "phone"
        clauses.append(NormalizeClause(
            id=cid(), label=f"Phone numbers must use digits-only format.",
            params=NormalizeParams(column=col, rule=NormalizationRule.digits_only),
        ))
        notes.append("Phone normalization mapped to digits_only rule.")

    # UNCHANGED_COLUMN — email
    email_kw = ["don't modify email", "do not modify email", "email unchanged",
                "leave email", "preserve email", "don't change email",
                "email addresses must not", "unchanged email"]
    email_cols = [c for c in columns if "email" in c.lower()]
    if any(kw in text for kw in email_kw):
        col = email_cols[0] if email_cols else "email"
        clauses.append(UnchangedColumnClause(
            id=cid(), label=f"Email column must not be modified.",
            params=UnchangedColumnParams(column=col),
        ))

    # PRESERVE_SUM
    sum_kw = ["preserve revenue", "keep revenue", "revenue unchanged",
              "total unchanged", "preserve total", "preserve sum",
              "sum unchanged"]
    revenue_cols = [c for c in columns if any(k in c.lower()
                    for k in ("revenue", "amount", "total", "price", "salary"))]
    if any(kw in text for kw in sum_kw) and revenue_cols:
        clauses.append(PreserveSumClause(
            id=cid(), label=f"Preserve total of {revenue_cols[0]}.",
            params=PreserveSumParams(column=revenue_cols[0]),
        ))

    if not clauses and not ambiguities:
        notes.append(
            "No recognisable clause patterns found in instruction. "
            "Please review and add clauses manually."
        )

    return Contract(
        version="1.0",
        instruction=instruction,
        entity_key=entity_key,
        status=ContractStatus.PROPOSED,
        clauses=clauses,
        ambiguities=ambiguities,
        compiler_notes=notes,
    )


# ── JSON parser ───────────────────────────────────────────────────────────────

def _parse_compiler_output(raw: str, instruction: str) -> Contract:
    """Parse the LLM JSON output into a Contract, falling back gracefully."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Extract JSON block if wrapped in markdown
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            return Contract(
                instruction=instruction,
                compiler_notes=["Compiler returned unparseable output. Please define clauses manually."],
            )

    clauses = []
    for raw_clause in data.get("clauses", []):
        try:
            t = raw_clause.get("type", "")
            p = raw_clause.get("params", {})
            cid = raw_clause.get("id") or f"clause_{uuid.uuid4().hex[:6]}"
            lbl = raw_clause.get("label", t)

            if t == ClauseType.PRESERVE_ENTITY:
                clauses.append(PreserveEntityClause(id=cid, label=lbl,
                    params=PreserveEntityParams(key=p["key"])))
            elif t == ClauseType.DEDUPE:
                clauses.append(DedupeClause(id=cid, label=lbl,
                    params=DedupeParams(key=p["key"])))
            elif t == ClauseType.NO_NEW_ENTITY:
                clauses.append(NoNewEntityClause(id=cid, label=lbl,
                    params=NoNewEntityParams(key=p["key"])))
            elif t == ClauseType.NORMALIZE:
                clauses.append(NormalizeClause(id=cid, label=lbl,
                    params=NormalizeParams(column=p["column"],
                                          rule=NormalizationRule(p["rule"]))))
            elif t == ClauseType.NO_NEW_NULLS:
                clauses.append(NoNewNullsClause(id=cid, label=lbl,
                    params=NoNewNullsParams(column=p["column"])))
            elif t == ClauseType.PRESERVE_SUM:
                clauses.append(PreserveSumClause(id=cid, label=lbl,
                    params=PreserveSumParams(
                        column=p["column"],
                        tolerance_type=p.get("tolerance_type", "absolute"),
                        tolerance_value=float(p.get("tolerance_value", 0)),
                    )))
            elif t == ClauseType.UNCHANGED_COLUMN:
                clauses.append(UnchangedColumnClause(id=cid, label=lbl,
                    params=UnchangedColumnParams(column=p["column"])))
            elif t == ClauseType.ROW_COUNT_RANGE:
                clauses.append(RowCountRangeClause(id=cid, label=lbl,
                    params=RowCountRangeParams(
                        min_ratio=float(p.get("min_ratio", 0.9)),
                        max_ratio=float(p.get("max_ratio", 1.0)),
                    )))
        except Exception:
            continue  # skip malformed clause, keep rest

    ambiguities = []
    for raw_amb in data.get("ambiguities", []):
        try:
            ambiguities.append(Ambiguity(
                id=raw_amb.get("id", f"amb_{uuid.uuid4().hex[:6]}"),
                field=raw_amb.get("field", ""),
                message=raw_amb.get("message", ""),
                options=raw_amb.get("options", []),
                required=raw_amb.get("required", True),
            ))
        except Exception:
            continue

    return Contract(
        version="1.0",
        instruction=instruction,
        entity_key=data.get("entity_key"),
        status=ContractStatus.PROPOSED,
        clauses=clauses,
        ambiguities=ambiguities,
        compiler_notes=data.get("compiler_notes", []),
    )


# ── Public entry point ────────────────────────────────────────────────────────

async def compile_contract(instruction: str, columns: list[str]) -> Contract:
    """
    Compile an instruction into a contract.
    Uses LLM if OpenAI key is set, otherwise falls back to heuristic compiler.
    """
    if settings.openai_api_key:
        try:
            return await compile_with_llm(instruction, columns)
        except Exception:
            pass  # fall through to heuristic
    return compile_heuristic(instruction, columns)
