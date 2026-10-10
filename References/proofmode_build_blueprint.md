# ProofMode Build Blueprint

## Purpose

This document combines the six implementation deliverables needed to start building ProofMode:

1. proposed backend contract schema,
2. proposed verification response schema,
3. first milestone task breakdown,
4. exact frontend page/component map,
5. backend module implementation order,
6. deterministic test plan.

ProofMode should be built as a narrow, end-to-end verification product for CSV transformations, which matches the Build With AI: Basics requirement to ship a new project with planning docs in the repository and a short working demo rather than expecting judges to run the code locally.[cite:110][cite:116]

## System boundary

ProofMode verifies whether an AI-transformed CSV obeyed a **user-approved, machine-checkable contract**. The contract compiler is assistive. The verifier is authoritative. The product must never let an LLM directly issue the final correctness judgment. Deterministic code does that.

The backend therefore has two responsibilities:
- translate approved contract JSON into executable deterministic checks,
- return evidence-rich results in a stable response shape.

## 1. Proposed backend contract schema

### Design goals

The contract schema should be:
- closed-vocabulary,
- easy for an LLM to emit safely,
- easy for a human to review,
- easy for Python to validate with Pydantic,
- strict enough that unsupported intent becomes explicit ambiguity instead of silent guessing.

FastAPI works well with Pydantic-style request and response models, and Pydantic examples can be included directly in generated JSON schema using `json_schema_extra`, which is useful for a hackathon project with API docs and strong type boundaries.[cite:284][cite:286][cite:287]

### Top-level contract object

```json
{
  "version": "1.0",
  "instruction": "Clean this customer dataset. Remove duplicates. Normalize phone numbers. Preserve every unique customer. Do not modify email addresses.",
  "entity_key": "customer_id",
  "status": "PROPOSED",
  "clauses": [],
  "ambiguities": [],
  "compiler_notes": []
}
```

### Top-level fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| `version` | string | Yes | Start with `1.0` for explicit schema versioning. |
| `instruction` | string | Yes | Original user instruction. |
| `entity_key` | string \\ null | Yes | Null allowed only before ambiguity is resolved. |
| `status` | enum | Yes | `PROPOSED` or `APPROVED`. |
| `clauses` | array | Yes | Ordered list of rule clauses. |
| `ambiguities` | array | Yes | Unresolved items requiring user input. |
| `compiler_notes` | array[string] | Yes | Human-readable notes about assumptions or constraints. |

### Contract status enum

```text
PROPOSED
APPROVED
```

### Clause base shape

```json
{
  "id": "clause_001",
  "type": "PRESERVE_ENTITY",
  "label": "Preserve every unique customer",
  "status_before_verification": "PROPOSED",
  "params": {}
}
```

### Common clause fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | string | Yes | Stable UI/backend reference. |
| `type` | enum | Yes | Closed vocabulary only. |
| `label` | string | Yes | Human-readable clause summary. |
| `status_before_verification` | enum | Yes | Always `PROPOSED` until approved. |
| `params` | object | Yes | Clause-specific parameters only. |

### Supported clause types

#### `PRESERVE_ENTITY`

```json
{
  "id": "clause_001",
  "type": "PRESERVE_ENTITY",
  "label": "Preserve every unique customer",
  "status_before_verification": "PROPOSED",
  "params": {
    "key": "customer_id"
  }
}
```

#### `DEDUPE`

```json
{
  "id": "clause_002",
  "type": "DEDUPE",
  "label": "Remove duplicate customers by customer_id",
  "status_before_verification": "PROPOSED",
  "params": {
    "key": "customer_id"
  }
}
```

#### `NO_NEW_ENTITY`

```json
{
  "id": "clause_003",
  "type": "NO_NEW_ENTITY",
  "label": "Do not add new customers",
  "status_before_verification": "PROPOSED",
  "params": {
    "key": "customer_id"
  }
}
```

#### `NORMALIZE`

```json
{
  "id": "clause_004",
  "type": "NORMALIZE",
  "label": "Normalize phone numbers to digits only",
  "status_before_verification": "PROPOSED",
  "params": {
    "column": "phone",
    "rule": "digits_only"
  }
}
```

Supported `rule` values for MVP:
- `digits_only`
- `lowercase`
- `uppercase`
- `trim_whitespace`

#### `NO_NEW_NULLS`

```json
{
  "id": "clause_005",
  "type": "NO_NEW_NULLS",
  "label": "Do not introduce new null emails",
  "status_before_verification": "PROPOSED",
  "params": {
    "column": "email"
  }
}
```

#### `PRESERVE_SUM`

```json
{
  "id": "clause_006",
  "type": "PRESERVE_SUM",
  "label": "Preserve total revenue",
  "status_before_verification": "PROPOSED",
  "params": {
    "column": "revenue",
    "tolerance_type": "absolute",
    "tolerance_value": 0
  }
}
```

#### `UNCHANGED_COLUMN`

```json
{
  "id": "clause_007",
  "type": "UNCHANGED_COLUMN",
  "label": "Do not modify email addresses",
  "status_before_verification": "PROPOSED",
  "params": {
    "column": "email",
    "apply_to": "surviving_entities"
  }
}
```

#### `ROW_COUNT_RANGE`

```json
{
  "id": "clause_008",
  "type": "ROW_COUNT_RANGE",
  "label": "Keep at least 95 percent of rows",
  "status_before_verification": "PROPOSED",
  "params": {
    "min_ratio": 0.95,
    "max_ratio": 1.0
  }
}
```

### Ambiguity object

```json
{
  "id": "ambiguity_001",
  "field": "entity_key",
  "message": "What identifies a unique customer?",
  "options": ["customer_id", "email", "phone"],
  "required": true
}
```

### Validation rules

- Reject unknown clause types.
- Reject missing required params.
- Reject columns not present in the uploaded schema preview.
- Reject contract approval if unresolved required ambiguities remain.
- Reject duplicate clause IDs.
- Allow multiple clauses of different types, but define whether duplicate types are permitted case by case.

### Proposed Pydantic model layout

```text
Contract
├── version: str
├── instruction: str
├── entity_key: str | None
├── status: ContractStatus
├── clauses: list[Clause]
├── ambiguities: list[Ambiguity]
└── compiler_notes: list[str]

Clause (discriminated union on type)
├── PreserveEntityClause
├── DedupeClause
├── NoNewEntityClause
├── NormalizeClause
├── NoNewNullsClause
├── PreserveSumClause
├── UnchangedColumnClause
└── RowCountRangeClause
```

### Recommended backend enums

```text
ContractStatus:
- PROPOSED
- APPROVED

ClauseType:
- PRESERVE_ENTITY
- DEDUPE
- NO_NEW_ENTITY
- NORMALIZE
- NO_NEW_NULLS
- PRESERVE_SUM
- UNCHANGED_COLUMN
- ROW_COUNT_RANGE

NormalizationRule:
- digits_only
- lowercase
- uppercase
- trim_whitespace
```

## 2. Proposed verification response schema

### Design goals

The response schema should:
- support dramatic summary screens,
- support clause-by-clause inspection,
- support exact evidence drilldowns,
- support re-verification reuse,
- keep results deterministic and inspectable,
- make UI rendering straightforward.

### Top-level verification response

```json
{
  "run_id": "verify_20261008_001",
  "contract_status": "APPROVED",
  "verification_mode": "DETERMINISTIC",
  "summary": {},
  "reconciliation": {},
  "clause_results": [],
  "evidence": [],
  "highlighted_ids": [],
  "repair_instruction": "",
  "warnings": []
}
```

### Top-level fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| `run_id` | string | Yes | Traceable verification run ID. |
| `contract_status` | enum | Yes | Should be `APPROVED` at verification time. |
| `verification_mode` | enum | Yes | Always `DETERMINISTIC` for MVP. |
| `summary` | object | Yes | High-level counts and verdict. |
| `reconciliation` | object | Yes | Record accounting buckets. |
| `clause_results` | array | Yes | Clause-level results. |
| `evidence` | array | Yes | Evidence objects keyed by ID. |
| `highlighted_ids` | array[string] | Yes | Important entities for immediate UI focus. |
| `repair_instruction` | string | Yes | Copyable fix instruction. |
| `warnings` | array[string] | Yes | Non-fatal limitations or notes. |

### Summary object

```json
{
  "overall_status": "FAILED",
  "before_row_count": 10000,
  "after_row_count": 9863,
  "surviving_rows": 9863,
  "explained_removals": 94,
  "unexplained_losses": 43,
  "new_entities": 0,
  "verified_clause_count": 4,
  "failed_clause_count": 1,
  "cant_verify_clause_count": 0
}
```

### Reconciliation object

```json
{
  "entity_key": "customer_id",
  "counts": {
    "SURVIVED": 9863,
    "LEGITIMATELY_REMOVED_DUPLICATE": 94,
    "UNEXPLAINED_LOSS": 43,
    "NEW_ENTITY": 0
  },
  "consistency_check": {
    "input_total": 10000,
    "accounted_total": 10000,
    "is_balanced": true
  }
}
```

### Clause result object

```json
{
  "clause_id": "clause_001",
  "type": "PRESERVE_ENTITY",
  "label": "Preserve every unique customer",
  "status": "FAILED",
  "verification_mode": "DETERMINISTIC",
  "summary": "43 customer IDs present in the original file are not present in the transformed file and are not explained by approved duplicate removal.",
  "counts": {
    "missing_entities": 43
  },
  "evidence_refs": ["evidence_014", "evidence_015", "evidence_016"]
}
```

### Clause result fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| `clause_id` | string | Yes | Links to contract clause. |
| `type` | enum | Yes | Same clause vocabulary. |
| `label` | string | Yes | Human-readable title. |
| `status` | enum | Yes | `VERIFIED`, `FAILED`, `CANT_VERIFY`. |
| `verification_mode` | enum | Yes | `DETERMINISTIC`. |
| `summary` | string | Yes | Plain-language result summary. |
| `counts` | object | Yes | Clause-specific metrics. |
| `evidence_refs` | array[string] | Yes | IDs into evidence array. |

### Evidence object

```json
{
  "id": "evidence_014",
  "kind": "missing_id",
  "entity_key": "CUS-01842",
  "before_row": {
    "customer_id": "CUS-01842",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "phone": "+91 98765 43210"
  },
  "after_row": null,
  "contract_context": {
    "clause_id": "clause_001",
    "clause_type": "PRESERVE_ENTITY"
  },
  "explanation": "Record exists in the original dataset but is absent from the transformed dataset and is not part of a valid duplicate group."
}
```

### Evidence kinds

- `missing_id`
- `new_id`
- `duplicate_group`
- `column_change`
- `invalid_format`
- `null_increase`
- `aggregate_mismatch`
- `row_count_violation`

### Highlighted IDs

This list should surface the most demo-worthy entities first, such as the first few unexplained missing IDs. The frontend can use this to jump directly into the evidence experience.

### Repair instruction rules

The repair instruction must:
- refer only to failed checks,
- preserve approved transformations,
- avoid asking the AI to reinvent the dataset,
- be concise and specific,
- include exact counts or IDs when useful.

Example:

```text
Restore the 43 missing customer records listed below.
Do not modify any other records.
Preserve approved duplicate removals.
Keep email values unchanged.
Keep phone values normalized to digits only.
Return the corrected CSV with the same column structure.
```

### Response status enums

```text
ClauseResultStatus:
- VERIFIED
- FAILED
- CANT_VERIFY

VerificationMode:
- DETERMINISTIC

OverallStatus:
- VERIFIED
- FAILED
- CANT_VERIFY
```

## 3. First milestone task breakdown

The first milestone should not start with frontend polish. It should lock the deterministic core and type boundaries first.

### Milestone 1 goal

Produce a backend-first vertical slice that can:
- accept an approved contract JSON,
- load two CSVs,
- run at least four core checks,
- return a typed verification response,
- pass deterministic tests.

### Milestone 1 tasks

#### Task group A — repository and scaffolding

- Create `/frontend`, `/backend`, `/assets`, `/docs`, and `.kiro/steering/` folders.[cite:258][cite:274][cite:276]
- Add `scope.md`, `prd.md`, and `spec.md` to repo root as required by the hackathon.[cite:110][cite:116]
- Add UI reference files under `assets/ui/`.
- Initialize backend Python environment and `requirements.txt`.
- Initialize frontend Vite React TypeScript app.

#### Task group B — backend schemas

- Implement Pydantic enums.
- Implement contract schema models.
- Implement verification response models.
- Add JSON schema examples for API docs where useful.[cite:284]

#### Task group C — CSV IO and validation

- Add CSV upload endpoint skeleton using FastAPI `UploadFile`.[cite:263][cite:265]
- Build CSV parsing utilities.
- Validate file type, file emptiness, and required columns.

#### Task group D — first rule engines

Implement these first because they create the strongest early demo:
- `PRESERVE_ENTITY`
- `DEDUPE`
- `NO_NEW_ENTITY`
- `UNCHANGED_COLUMN`

Then add:
- reconciliation summary,
- evidence builder for missing IDs and changed fields,
- draft repair instruction.

#### Task group E — deterministic tests

- Create fixture CSVs.
- Add happy-path and failure-path tests for the first four rules.
- Add reconciliation consistency test.

#### Task group F — thin frontend smoke flow

- Build upload screen.
- Hardcode one approved contract temporarily.
- Call `/verify` and render JSON-backed results.
- Show row counts and unexplained loss count.

### Milestone 1 exit criteria

Milestone 1 is complete when:
- backend verification works for the first four rules,
- response schema is stable,
- test suite passes,
- frontend can demonstrate a failed run with evidence.

## 4. Exact frontend page/component map

The frontend should be a guided story, not a dashboard. The storyboard already defines a 12-scene rhythm, so the page and component map should follow that shape closely.[image:1][file:255]

### Frontend route or state map

Recommended route structure:

```text
/
/verify/upload
/verify/contract
/verify/running
/verify/results
/verify/evidence
/verify/repair
/verify/reverify
/verify/success
```

A state-machine implementation is even better than free-form routing for consistency.

### Page map

#### 1. `LandingPage`

Purpose:
- explain the product,
- establish mood,
- start new verification.

Components:
- `SiteHeader`
- `HeroStatement`
- `PrimaryCTA`
- `SecondaryCTA`
- `MiniStepPreview`
- `AmbientEvidenceVisual`

#### 2. `UploadPage`

Purpose:
- collect files and original instruction.

Components:
- `WizardHeader`
- `StepIndicator`
- `FileUploadCard` for original CSV
- `FileUploadCard` for transformed CSV
- `InstructionTextarea`
- `ColumnPreviewStrip`
- `ContinueButton`

#### 3. `ContractPage`

Purpose:
- show suggested contract,
- resolve ambiguity,
- capture approval.

Components:
- `WizardHeader`
- `StepIndicator`
- `InstructionCard`
- `ContractClauseList`
- `ContractClauseCard`
- `AmbiguityResolver`
- `EntityKeySelector`
- `CompilerNotesPanel`
- `ApproveContractButton`

#### 4. `VerifyProgressPage`

Purpose:
- make verification feel active and legible.

Components:
- `WizardHeader`
- `StepIndicator`
- `ProgressHeadline`
- `RecordFlowVisual`
- `VerificationChecklist`
- `AnimatedCounters`

#### 5. `ResultsPage`

Purpose:
- reveal top-level record accounting.

Components:
- `WizardHeader`
- `StepIndicator`
- `SummaryHeroNumber`
- `ReconciliationGrid`
- `OutcomeLegend`
- `PrimaryIssueCallout`
- `GoToEvidenceButton`

#### 6. `EvidencePage`

Purpose:
- prove a failure with concrete record-level evidence.

Components:
- `WizardHeader`
- `StepIndicator`
- `EvidenceNavigator`
- `EvidenceStatusBadge`
- `BeforeAfterRecordPanel`
- `RuleExplanationChecklist`
- `EvidenceSidebar`

#### 7. `RepairPage`

Purpose:
- provide copyable fix instruction.

Components:
- `WizardHeader`
- `StepIndicator`
- `RepairInstructionCard`
- `CopyInstructionButton`
- `FailureSummaryMiniPanel`
- `ContinueToReverifyButton`

#### 8. `ReverifyPage`

Purpose:
- upload corrected output.

Components:
- `WizardHeader`
- `StepIndicator`
- `CorrectedUploadCard`
- `ApprovedContractSummary`
- `RunReverifyButton`

#### 9. `SuccessPage`

Purpose:
- close the loop with a clean verified state.

Components:
- `WizardHeader`
- `StepIndicator`
- `VerifiedHero`
- `FinalCountsSummary`
- `DownloadReportButton`
- `StartNewVerificationButton`

### Shared components

#### Layout
- `SiteHeader`
- `WizardHeader`
- `StepIndicator`
- `PageFrame`
- `SectionShell`

#### Upload
- `FileUploadCard`
- `FileMetaPill`
- `DropzoneSurface`
- `ColumnPreviewStrip`

#### Contract
- `InstructionCard`
- `ContractClauseList`
- `ContractClauseCard`
- `ClauseParamEditor`
- `AmbiguityResolver`
- `EntityKeySelector`
- `ApprovalFooter`

#### Verification
- `VerificationChecklist`
- `AnimatedCounters`
- `ReconciliationGrid`
- `OutcomeChip`
- `SummaryHeroNumber`

#### Evidence
- `EvidenceNavigator`
- `EvidenceStatusBadge`
- `BeforeRecordCard`
- `AfterRecordCard`
- `EvidenceReasonList`
- `DuplicateReferenceCard`

#### Repair
- `RepairInstructionCard`
- `CopyInstructionButton`
- `ApprovedContractSummary`

#### Utility
- `StatusPill`
- `LoadingShimmer`
- `ErrorBanner`
- `EmptyState`

### Frontend state slices

Recommended state slices:
- uploaded files metadata,
- raw instruction text,
- proposed contract,
- approved contract,
- verification response,
- selected evidence item,
- repair instruction copied state,
- current flow step.

## 5. Backend module implementation order

Build backend modules in the order that reduces risk and enables tests earliest.

### Recommended backend structure

```text
backend/app/
├── main.py
├── api/
├── core/
├── models/
├── services/
├── rules/
└── utils/
```

### Implementation order

#### Step 1 — foundational models

Create:
- `models/contract.py`
- `models/verification.py`

Why first:
Everything else depends on stable request and response shapes.

#### Step 2 — CSV and validation utilities

Create:
- `utils/csv_io.py`
- `utils/schema_checks.py`
- `utils/regex_rules.py`

Why second:
No rule engine should exist before file and column validation are reliable.

#### Step 3 — core rule modules

Implement in this order:
1. `rules/preserve_entity.py`
2. `rules/dedupe.py`
3. `rules/no_new_entity.py`
4. `rules/unchanged_column.py`
5. `rules/normalize.py`
6. `rules/no_new_nulls.py`
7. `rules/preserve_sum.py`
8. `rules/row_count_range.py`

Why this order:
- the first four create the strongest early value,
- normalize and null checks are straightforward extensions,
- sum and row-range are easiest once response structures exist.

#### Step 4 — reconciliation service

Create:
- `services/reconciliation.py`

Why now:
After the first rule outputs exist, reconciliation can consolidate them into a coherent narrative.

#### Step 5 — evidence builder

Create:
- `services/evidence_builder.py`

Why here:
It transforms raw rule outputs into UI-friendly proof objects.

#### Step 6 — repair instruction generator

Create:
- `services/repair_instruction.py`

Why here:
It depends on stable failed clause results and evidence outputs.

#### Step 7 — orchestrator verifier

Create:
- `services/verifier.py`

Responsibilities:
- validate approved contract,
- run rule modules,
- run reconciliation,
- collect evidence,
- generate repair instruction,
- return typed response.

#### Step 8 — contract compiler service

Create:
- `services/contract_compiler.py`

Why later:
The verifier is the true product core. Compiler quality matters, but the deterministic engine should be built first.

#### Step 9 — API routes

Create:
- `api/routes_compile.py`
- `api/routes_verify.py`
- `api/routes_reverify.py`
- optional `api/routes_repair.py`

Use FastAPI `UploadFile` for file endpoints because it preserves filename, content type, file-like access, and scales better than raw byte uploads for realistic file-processing flows.[cite:263][cite:265][cite:277][cite:285]

#### Step 10 — app assembly

Create:
- `main.py`
- `core/config.py`
- `core/logging.py`

## 6. Deterministic test plan

The test plan is one of the strongest parts of the project because it proves that ProofMode is not just plausible-looking. It catches seeded failures through exact checks.

### Testing goals

- prove deterministic behavior for all supported clauses,
- prove reconciliation totals are internally consistent,
- prove the system handles ambiguous or invalid contracts safely,
- prove the strongest demo scenarios reliably reproduce.

### Test layers

#### Layer 1 — schema validation tests

Files:
- `test_contract_schema.py`
- `test_verification_schema.py`

Test cases:
- valid contract accepted,
- unsupported clause type rejected,
- required param missing rejected,
- unresolved ambiguity blocks approval,
- malformed row-range values rejected,
- invalid normalization rule rejected.

#### Layer 2 — utility tests

Files:
- `test_csv_io.py`
- `test_regex_rules.py`
- `test_schema_checks.py`

Test cases:
- CSV loads correctly,
- empty file is rejected,
- missing columns are detected,
- regex rules behave as expected,
- numeric parsing for sum checks behaves consistently.

#### Layer 3 — rule unit tests

Files:
- `test_preserve_entity.py`
- `test_dedupe.py`
- `test_no_new_entity.py`
- `test_unchanged_column.py`
- `test_normalize.py`
- `test_no_new_nulls.py`
- `test_preserve_sum.py`
- `test_row_count_range.py`

Test each rule with:
- clear pass case,
- clear fail case,
- boundary case,
- malformed contract params case where relevant.

#### Layer 4 — reconciliation tests

File:
- `test_reconciliation.py`

Test cases:
- total accounting balances,
- explained duplicate removals are not double-counted,
- unexplained losses are separated cleanly,
- new entities counted correctly,
- no speculative categories created.

#### Layer 5 — evidence tests

File:
- `test_evidence_builder.py`

Test cases:
- missing ID evidence contains before row and null after row,
- changed-column evidence includes before and after values,
- duplicate evidence points to correct grouped rows,
- evidence refs map correctly to clause results.

#### Layer 6 — orchestrator integration tests

File:
- `test_verifier.py`

Test cases:
- approved contract produces typed response,
- failed run returns repair instruction,
- pass run returns overall verified,
- warnings populate correctly for non-fatal issues.

#### Layer 7 — mutation tests

File:
- `test_mutations.py`

Seeded scenarios:
1. Delete 43 legitimate customers → expect `FAILED`.
2. Add 10 fake customers → expect `FAILED`.
3. Change 5 protected email values → expect `FAILED`.
4. Break phone normalization on several rows → expect `FAILED`.
5. Introduce 20 new nulls → expect `FAILED`.
6. Remove only approved duplicates → expect `VERIFIED` if all else passes.
7. Keep row count below allowed threshold → expect `FAILED`.
8. Change revenue total beyond tolerance → expect `FAILED`.

### Contract compiler evaluation set

Because the compiler is the least trustworthy layer, maintain a test set for natural-language mapping.

File:
- `test_contract_compiler.py`

Examples:

| Instruction | Expected output |
|---|---|
| Remove duplicate emails | `DEDUPE(email)` |
| Keep every customer | `PRESERVE_ENTITY(customer_id)` |
| Don’t add customers | `NO_NEW_ENTITY(customer_id)` |
| Don’t modify prices | `UNCHANGED_COLUMN(price)` |
| Phone numbers should contain digits only | `NORMALIZE(phone, digits_only)` |
| Keep revenue unchanged | `PRESERVE_SUM(revenue)` |

Also include paraphrases:
- don’t lose any customers,
- retain every unique client,
- strip formatting from telephone numbers,
- leave emails untouched.

### Golden demo tests

Create locked test fixtures for the demo:
- `customers_before.csv`
- `customers_after_broken.csv`
- `customers_after_fixed.csv`

Required assertions:
- broken file returns 94 explained removals and 43 unexplained losses,
- corrected file returns 0 unexplained losses,
- final state returns `overall_status = VERIFIED`.

### Recommended fixture strategy

Use:
- small hand-written fixtures for unit tests,
- medium fixtures for edge-case integration tests,
- one large demo fixture for the final showcase.

### CI priorities

At minimum, every commit affecting backend logic should run:
- schema tests,
- rule tests,
- reconciliation tests,
- golden demo tests.

This is especially important if Kiro is generating or modifying code, because steering helps preserve standards but tests enforce them automatically across sessions.[cite:258][cite:261][cite:274][cite:276]

## Final recommendation

Start by implementing the contract schema and verification response schema exactly, then build the first four rule engines and their tests before spending time on UI polish. Once the backend truth model is stable, the cinematic frontend can be built around it with much lower risk.
