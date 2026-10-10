# ProofMode Spec

## Purpose

This document defines the implementation specification for ProofMode, a React + FastAPI application that verifies whether an AI-transformed CSV file obeys a user-approved, machine-checkable contract. The repository must include `scope.md`, `prd.md`, and `spec.md` for the Build With AI: Basics submission, and the demo must work clearly in a short recorded presentation rather than relying on judges to install or run the code.[cite:110][cite:116]

## Product definition

ProofMode is not a general AI evaluator. It is a deterministic verification product for structured CSV transformations. The product separates an assistive contract compiler from an authoritative verification engine:

- The **contract compiler** turns natural language into a proposed contract.
- The **user** reviews and approves the contract.
- The **verifier** checks the transformed dataset against that approved contract.
- The **UI** presents evidence, repair instructions, and re-verification.

The product must refuse to mark unverifiable claims as passed. Any unsupported or ambiguous requirement must be returned as `CANT_VERIFY`.

## Scope of this spec

This spec covers:

- end-to-end user flow,
- supported contract language,
- verification logic,
- frontend architecture,
- backend architecture,
- API design,
- schemas,
- error handling,
- testing,
- milestone order,
- acceptance criteria.

This spec does not expand scope beyond CSV transformation verification.

## Goals

### Product goals

- Prove whether an AI-performed CSV transformation followed explicit instructions.
- Surface exact evidence for failures.
- Separate legitimate removals from unexplained losses.
- Generate precise repair instructions.
- Support a clean re-verification loop.

### Demo goals

- Make the product understandable within 15 seconds.
- Deliver one strong “hidden failure revealed” moment.
- End with a satisfying corrected-state verification.
- Align tightly with the uploaded UI spec and storyboard so the product feels distinct and premium.[file:255][image:1]

### Technical goals

- Keep the verifier deterministic.
- Keep the contract language closed and schema-validated.
- Keep the architecture small enough for hackathon delivery.
- Keep the codebase organized so Kiro can work effectively with steering and spec-driven tasks.[cite:258][cite:261][cite:276]

## Non-goals

- No support for PDFs, DOCX files, websites, or code repositories.
- No fully autonomous repair.
- No fuzzy matching or inferred merge logic.
- No semantic correctness scoring.
- No user accounts or team collaboration.
- No multi-tenant persistence requirements.
- No broad analytics dashboard.

## System principles

1. **Deterministic core** — verification logic must be reproducible and code-driven.
2. **Bounded contract language** — no arbitrary validation logic from the model.
3. **Human approval gate** — contract must be approved before verification.
4. **Evidence-first UI** — every important verdict should be inspectable.
5. **Honest uncertainty** — unsupported intent becomes `CANT_VERIFY`.
6. **Narrative demo flow** — the product is a guided verification experience, not a general workspace.

## User stories

### Primary user stories

- As a user, I want to upload an original CSV and an AI-transformed CSV so I can compare them.
- As a user, I want to paste the instruction I gave to AI so the product understands what should be verified.
- As a user, I want to review the generated contract before verification so the system does not guess my intent.
- As a user, I want deterministic pass/fail results with evidence so I can trust the output.
- As a user, I want a repair instruction so I can send it back to my AI tool.
- As a user, I want to re-upload a corrected CSV so I can confirm the fix.

### Judge-centric story

- As a hackathon judge, I want to understand the product quickly, see a convincing hidden-error reveal, inspect the proof, and watch the fix-confirmation loop complete without ambiguity.[cite:113][cite:116]

## End-to-end flow

### Stage 1 — Landing

Purpose:
- explain what ProofMode does,
- establish product tone,
- funnel user into the flow.

Key UI:
- large serif headline,
- short positioning line,
- primary CTA,
- minimal nav,
- subtle verification step preview.

### Stage 2 — Upload files

Inputs:
- original CSV,
- transformed CSV,
- transformation instruction text.

System behavior:
- validate file types,
- parse filename and basic metadata,
- hold files in session state.

### Stage 3 — Compile contract

System behavior:
- send instruction + optional previewed columns to contract compiler,
- return proposed contract JSON,
- return ambiguity notes,
- render editable contract UI.

User actions:
- change entity key,
- edit or remove clauses,
- resolve ambiguities,
- approve contract.

### Stage 4 — Verify

System behavior:
- send approved contract + both files to backend verifier,
- run deterministic rule checks,
- build clause-level results,
- build reconciliation summary,
- build evidence payloads,
- return repair instruction draft.

### Stage 5 — Results summary

UI purpose:
- reveal row counts,
- distinguish explained removals from unexplained losses,
- create the main dramatic moment.

### Stage 6 — Evidence inspection

UI purpose:
- drill into missing IDs,
- inspect duplicate groups,
- inspect changed columns,
- inspect failed normalization examples.

### Stage 7 — Repair instruction

UI purpose:
- show concise repair text,
- allow copy action,
- explain that external AI performs the fix.

### Stage 8 — Re-verify

Inputs:
- corrected CSV.

System behavior:
- rerun verification against the same approved contract,
- return updated summary,
- show final verified state if all checks pass.

## Supported contract model

### Top-level contract object

```json
{
  "entity_key": "customer_id",
  "clauses": [],
  "ambiguities": [],
  "compiler_notes": []
}
```

### Required top-level fields

- `entity_key: string`
- `clauses: Clause[]`
- `ambiguities: Ambiguity[]`
- `compiler_notes: string[]`

### Clause common fields

Each clause must include:

- `id: string`
- `type: string`
- `label: string`
- `status_before_verification: "PROPOSED"`
- `params: object`

### Supported clause types

#### `PRESERVE_ENTITY`

Parameters:
- `key: string`

Meaning:
Every unique entity in `before` must still exist in `after`, except where an allowed exact-key dedupe rule explains removal.

#### `DEDUPE`

Parameters:
- `key: string`

Meaning:
Duplicate rows by exact key may be removed.

#### `NO_NEW_ENTITY`

Parameters:
- `key: string`

Meaning:
No new entity key may appear in `after`.

#### `NORMALIZE`

Parameters:
- `column: string`
- `rule: "digits_only" | "lowercase" | "uppercase" | "trim_whitespace"`

Meaning:
A specific normalized format is required.

#### `NO_NEW_NULLS`

Parameters:
- `column: string`

Meaning:
The transformation must not introduce additional nulls in the specified column.

#### `PRESERVE_SUM`

Parameters:
- `column: string`
- `tolerance_type: "absolute" | "percentage"`
- `tolerance_value: number`

Meaning:
The aggregate sum must be preserved within explicit tolerance.

#### `UNCHANGED_COLUMN`

Parameters:
- `column: string`
- `apply_to: "surviving_entities"`

Meaning:
Protected field values must remain unchanged for all surviving entities.

#### `ROW_COUNT_RANGE`

Parameters:
- `min_ratio: number`
- `max_ratio: number`

Meaning:
The output row count must remain within an approved range.

## Contract compiler specification

### Inputs

- user instruction text,
- inferred column names from uploaded CSV previews,
- optional user hints.

### Outputs

- proposed contract JSON,
- ambiguity list,
- compiler notes.

### Required constraints

- Only output supported clause types.
- Never output executable code.
- Never claim verification results.
- Prefer asking for clarification when intent is ambiguous.
- If no trustworthy entity key can be inferred, emit ambiguity rather than guessing.

### Example ambiguity output

```json
{
  "field": "dedupe.key",
  "message": "Duplicate definition is ambiguous.",
  "options": ["customer_id", "email", "phone"]
}
```

## Verification engine specification

### Backend stack

- FastAPI for request handling and multipart file upload.[cite:263][cite:265][cite:277]
- Pandas for CSV parsing and dataframe operations.
- Pydantic for request and response validation.
- Python service modules for rule execution.

### File handling

Use `UploadFile` for CSV uploads because it supports file metadata, file-like access, and spooled handling that is better suited to production-style uploads than raw in-memory bytes handling.[cite:263][cite:265][cite:273][cite:277]

### Verification pipeline

1. Validate both files are CSV-like.
2. Parse both files into dataframes.
3. Validate contract schema.
4. Validate referenced columns exist.
5. Build exact entity sets.
6. Run each clause checker.
7. Build reconciliation summary.
8. Build evidence payloads.
9. Build repair instruction.
10. Return response.

### Rule implementation details

#### Preserve entity checker

Algorithm:
- Compute unique IDs in `before`.
- Compute IDs in `after`.
- Compute missing IDs.
- Subtract IDs explainable by exact-key dedupe if applicable.
- Remaining missing IDs become unexplained losses.

Output:
- count of preserved unique IDs,
- list of missing IDs,
- pass/fail status.

#### Dedupe checker

Algorithm:
- Group `before` by dedupe key.
- Identify duplicate groups where count > 1.
- Determine maximum legitimate removals from duplicate groups.
- Compare actual removals against allowed removals.
- Mark extra removals as unexplained.

#### No new entity checker

Algorithm:
- Compute `after_ids - before_ids`.
- Any remainder is a violation.

#### Normalize checker

Algorithm:
- Apply rule validation to target column in `after`.
- Return rows that fail the normalization rule.

#### No new nulls checker

Algorithm:
- Compare null count for target column in `before` and `after`.
- If `after_nulls > before_nulls`, fail.

#### Preserve sum checker

Algorithm:
- Compute sum of target numeric column in both frames.
- Compute difference.
- Compare against explicit tolerance.

#### Unchanged column checker

Algorithm:
- Inner join surviving entities by entity key.
- Compare protected column values row by row.
- Emit mismatches.

#### Row count range checker

Algorithm:
- Compute `after_count / before_count`.
- Verify ratio falls within range.

## Reconciliation model

### Required categories

- `SURVIVED`
- `LEGITIMATELY_REMOVED_DUPLICATE`
- `UNEXPLAINED_LOSS`
- `NEW_ENTITY`

### Rules

- Categories must be mutually exclusive.
- Categories must not double-count records.
- Conservative accounting is preferred over speculative categorization.
- `MERGED_INTO` and fuzzy lineage are out of scope.

## Verification result schema

### Top-level response

```json
{
  "summary": {
    "before_row_count": 10000,
    "after_row_count": 9863,
    "explained_removals": 94,
    "unexplained_losses": 43,
    "new_entities": 0
  },
  "clause_results": [],
  "highlighted_ids": [],
  "repair_instruction": "..."
}
```

### Clause result schema

Each clause result must include:

- `clause_id: string`
- `type: string`
- `status: "VERIFIED" | "FAILED" | "CANT_VERIFY"`
- `verification_mode: "DETERMINISTIC"`
- `summary: string`
- `counts: object`
- `evidence_refs: string[]`

### Evidence object schema

Each evidence object should include:

- `id: string`
- `kind: "missing_id" | "new_id" | "duplicate_group" | "column_change" | "invalid_format" | "null_increase" | "aggregate_mismatch"`
- `entity_key: string | null`
- `before_row: object | null`
- `after_row: object | null`
- `explanation: string`

## API specification

### `POST /compile-contract`

Request:
- multipart or JSON payload containing instruction text and optional column names.

Response:
- proposed contract,
- ambiguities,
- notes.

### `POST /verify`

Request:
- original CSV,
- transformed CSV,
- approved contract JSON.

Response:
- verification summary,
- clause results,
- evidence payloads,
- repair instruction.

### `POST /reverify`

Request:
- original CSV,
- corrected CSV,
- approved contract JSON.

Response:
- same shape as `/verify`.

### Optional `POST /generate-repair-instruction`

Request:
- failed verification response,
- approved contract.

Response:
- repair instruction text.

## Error handling

### User-facing errors

- invalid file type,
- CSV parse failure,
- missing required columns,
- empty file,
- malformed contract,
- ambiguous contract not yet resolved,
- verification unavailable because entity key is undefined.

### UX requirements for errors

- Errors must be explicit and calm.
- Errors must explain what to fix.
- Errors must not feel like stack traces.
- If a contract is ambiguous, the UI must guide resolution rather than silently default.

## Frontend specification

### Frontend stack

- React
- TypeScript
- Vite
- Tailwind CSS with custom tokens
- Motion for React for transitions and presence animation.[cite:264]

### Page architecture

Recommended pages or screen modules:
- `LandingPage`
- `UploadPage`
- `ContractPage`
- `VerifyProgressPage`
- `ResultsPage`
- `EvidencePage`
- `RepairPage`
- `ReverifyPage`
- `SuccessPage`

### State model

Use a flow-state or state-machine-style model rather than scattered booleans.

Recommended top-level states:
- `idle`
- `files_uploaded`
- `contract_proposed`
- `contract_approved`
- `verifying`
- `results_ready`
- `repair_ready`
- `reverifying`
- `verified`
- `error`

### Key components

- `HeroSection`
- `FileUploadCard`
- `InstructionTextarea`
- `ContractClauseCard`
- `AmbiguityResolver`
- `VerificationStepper`
- `ReconciliationSummary`
- `EvidenceList`
- `RecordEvidencePanel`
- `RepairInstructionBox`
- `VerificationBadge`

## Visual and interaction specification

The attached design references are binding art direction inputs for the build. The product must feel cinematic, sparse, premium, and evidence-led.[file:255][image:1]

### Typography

Recommended font pairing:
- Instrument Serif for display,
- Inter for interface copy,
- IBM Plex Mono for evidence and IDs.[file:255]

### Color

- near-black backgrounds,
- warm off-white text,
- muted semantic pass/fail colors,
- restrained use of accent color.

### Motion

- use motion to reveal system state,
- animate counters and transitions calmly,
- avoid decorative or noisy movement,
- emphasize the tension-release rhythm from results to repair to success.[file:255]

### Layout

- no permanent enterprise sidebar,
- one primary focus area per screen,
- centered stepper or progress indicator,
- evidence displayed in high-contrast panels,
- negative space used intentionally.

## Accessibility requirements

- keyboard-accessible file upload controls,
- visible focus states,
- semantic HTML,
- accessible color contrast,
- motion reduced when user prefers reduced motion,
- descriptive error messages,
- all icons and controls labeled appropriately.

## Test plan

### Unit tests

Create tests for each rule module:
- preserve entity,
- dedupe,
- no new entity,
- normalize,
- no new nulls,
- preserve sum,
- unchanged column,
- row count range.

### Contract schema tests

- valid contracts accepted,
- unsupported clause rejected,
- malformed parameters rejected,
- ambiguity handling preserved.

### Contract compilation evaluation set

Prepare a table of input instructions and expected clause outputs.

Examples:

| Instruction | Expected contract piece |
|---|---|
| Remove duplicate emails | `DEDUPE(email)` |
| Preserve every customer | `PRESERVE_ENTITY(customer_id)` |
| Don’t modify price | `UNCHANGED_COLUMN(price)` |
| Keep revenue unchanged | `PRESERVE_SUM(revenue)` |
| Phone numbers should contain digits only | `NORMALIZE(phone,digits_only)` |

### Mutation tests

Seed these failure cases:
- delete 43 valid customers,
- insert 10 fake customers,
- alter protected emails,
- add 20 new nulls,
- break phone normalization,
- allow only legitimate duplicate removal.

Expected behavior:
- genuine violations fail,
- valid duplicate cleanup passes,
- evidence points to exact IDs or rows.

## Demo dataset specification

Create a fixed demo dataset with:
- 10,000 original rows,
- a broken transformed file with 94 legitimate duplicate removals and 43 unexplained missing entities,
- a repaired file with all records accounted for.

The data should support at least these clauses in the demo contract:
- preserve entity by `customer_id`,
- dedupe by `customer_id`,
- no new entity,
- normalize phone to digits only,
- unchanged email.

## Folder structure

```text
proofmode/
├── README.md
├── scope.md
├── prd.md
├── spec.md
├── .kiro/
│   └── steering/
│       ├── product.md
│       ├── tech.md
│       └── structure.md
├── assets/
│   ├── ui/
│   ├── demo-data/
│   └── branding/
├── frontend/
│   └── src/
├── backend/
│   ├── app/
│   └── tests/
└── docs/
```

Kiro steering belongs in `.kiro/steering/`, where workspace markdown files persist project-specific rules and conventions across sessions.[cite:258][cite:274][cite:276]

## Milestone plan

### Milestone 1 — schemas and tests

- define contract schema,
- define response schema,
- create demo fixtures,
- implement rule-level tests.

### Milestone 2 — verifier core

- implement CSV loading,
- implement all rule checkers,
- implement reconciliation,
- implement evidence builder.

### Milestone 3 — compiler and API

- implement contract compiler stub or bounded LLM layer,
- build FastAPI endpoints,
- validate request and response payloads.

### Milestone 4 — frontend flow

- implement upload flow,
- implement contract review UI,
- implement results summary,
- implement evidence drilldown,
- implement repair and reverify flow.

### Milestone 5 — polish and submission

- refine visual fidelity,
- script demo,
- write README,
- validate planning docs and repo structure.[cite:110][cite:116]

## Acceptance criteria

### Contract compiler acceptance

- Only supported clause types appear.
- Ambiguous instructions are flagged.
- User can edit and approve contract.
- No arbitrary code is produced.

### Verifier acceptance

- Every supported rule has deterministic tests.
- Same inputs produce same outputs.
- Missing entities and new entities are identified exactly.
- Protected-field changes are surfaced exactly.
- Reconciliation totals are internally consistent.

### UI acceptance

- Main flow matches the storyboard narrative.[image:1]
- The product feels distinct from generic SaaS dashboards.[file:255]
- The results screen clearly distinguishes explained removals from unexplained loss.
- Evidence view makes at least one failed record undeniable.
- Repair instruction is easy to copy and understand.
- Final verified state feels conclusive.

### Submission acceptance

- `scope.md`, `prd.md`, and `spec.md` are present in the repository as required.[cite:110][cite:116]
- The repository is public for submission review.[cite:116][cite:280]
- The demo can be understood without the judge running the code.[cite:116][cite:280]

## Kiro implementation guidance

After placing this file in the repository, Kiro should use it as project truth together with `scope.md`, `prd.md`, the UI art-direction spec, and the storyboard. Steering files in `.kiro/steering/` should then lock the product overview, technology standards, and structure conventions so code generation remains aligned across sessions.[cite:258][cite:261][cite:274][cite:276]

## Final build instruction

Build the smallest version of ProofMode that can produce one unforgettable result:

- an AI-transformed CSV looked acceptable,
- ProofMode proved 43 records had no valid fate,
- a precise repair instruction fixed the issue,
- re-verification confirmed the corrected output.

Everything that does not strengthen that loop is lower priority.
