# ProofMode Scope

## Project summary

ProofMode is a web application that verifies whether an AI-transformed CSV dataset obeyed a user-approved, machine-checkable contract. The MVP is intentionally narrow: it supports CSV transformation verification only, and it distinguishes between a suggestive AI contract compiler and a deterministic verification engine so that only provable claims are marked as verified.[cite:110][cite:113]

## Problem statement

People increasingly use AI tools to clean, transform, and standardize spreadsheet-like data, but they often cannot tell whether the AI silently dropped records, altered protected fields, introduced invalid values, or otherwise violated the original instruction. Existing dataframe-comparison and data-validation tools can compare tables or enforce expectations, but they are not packaged as a consumer-facing workflow that converts a plain-English instruction into a reviewable contract, verifies the transformation against that contract, and generates a repair instruction for re-checking.[cite:236][cite:237][cite:242][cite:253]

## Goal

Deliver a polished, end-to-end proof of concept for the Build With AI: Basics hackathon that:

- accepts an original CSV and AI-transformed CSV,
- compiles the user’s instruction into a bounded contract,
- requires human approval of that contract,
- performs deterministic verification,
- presents proof for each verdict,
- produces a precise repair instruction,
- allows re-verification of the corrected file.[cite:110][cite:113]

## Core principle

ProofMode does not verify everything. It verifies what it can **prove**. The LLM may propose a contract, but the user approves it and the verifier determines results through code. Any requirement outside the supported deterministic schema must be flagged as **CAN'T VERIFY**, not guessed.[cite:236][cite:237]

## In scope

### Input scope

- Upload original CSV file.
- Upload AI-transformed CSV file.
- Paste natural-language transformation instruction.
- Review and edit generated contract before running verification.

### Contract scope

The MVP supports only a closed set of clause types:

- `PRESERVE_ENTITY`
- `DEDUPE`
- `NO_NEW_ENTITY`
- `NORMALIZE`
- `NO_NEW_NULLS`
- `PRESERVE_SUM`
- `UNCHANGED_COLUMN`
- `ROW_COUNT_RANGE`

The contract compiler may only map text into this vocabulary. It must not generate custom code or arbitrary evaluation logic.

### Verification scope

Supported deterministic checks:

- Exact entity-key preservation.
- Exact duplicate removal by approved key.
- No new entity introduction.
- Regex- or rule-based column normalization.
- No new nulls in specified columns.
- Aggregate preservation for numeric columns with explicit tolerance.
- Exact unchanged-column checks for surviving entities.
- Row-count constraints.
- Reconciliation of record outcomes into conservative exact states.

### Evidence scope

ProofMode must show evidence for each clause result, such as:

- missing IDs,
- new IDs,
- duplicate groups,
- rows with invalid normalization,
- rows with new nulls,
- changed protected values,
- aggregate mismatch summaries.

### Repair scope

The system generates a repair instruction only. It does not automatically rewrite the CSV. The user must take the instruction to their AI tool, generate a corrected file, and upload that corrected file for re-verification.

### Demo scope

The demo flow should follow a single cinematic journey:

1. Landing.
2. Upload files.
3. Set contract.
4. Run verification.
5. Reveal reconciliation.
6. Show unexplained losses.
7. Inspect record evidence.
8. Show legitimate removals.
9. Generate repair instruction.
10. Re-upload corrected file.
11. Re-verify.
12. End on verified state.

The strongest demonstration moment is not “137 rows were removed.” It is “94 removals are explained, but 43 customer IDs have no valid fate under the approved contract.”

## Out of scope

The MVP must explicitly exclude:

- PDF, DOCX, or free-form document verification.
- Code diff or repository verification.
- Research answer verification.
- Browser extension support.
- User accounts, team spaces, and authentication.
- Databases for persistent multi-user storage.
- Fuzzy entity matching.
- Inferred merge resolution.
- Semantic correctness checks such as “is this customer correct?”
- Open-ended confidence scoring such as “91% correct.”
- Autonomous repair of transformed files.
- Generic AI chat assistant features.

## User experience boundaries

The product must expose three truth states only:

- `VERIFIED`
- `FAILED`
- `CANT_VERIFY`

The interface must never imply certainty when certainty is unavailable. If an instruction is ambiguous, the system must require clarification before verification proceeds.

## Technical scope

### Frontend

- React + TypeScript + Vite.
- Tailwind CSS with custom design tokens and non-generic styling.
- Motion-driven screen transitions aligned to the storyboard and UI art direction.[cite:264][file:255][image:1]

### Backend

- FastAPI API with file upload endpoints using `UploadFile`, which is appropriate for form-based file uploads and file-like processing workflows.[cite:263][cite:265][cite:277]
- Python verification engine.
- Pandas for CSV parsing and comparison.
- Pydantic for contract and response schemas.

### Tooling and agent support

Kiro steering files should be used for persistent product, stack, and structure guidance, because Kiro’s steering system is designed for markdown-based project conventions that load automatically across sessions.[cite:258][cite:274][cite:276]

## Success criteria

The MVP is successful if it can do all of the following in a stable demo:

- Compile a plain-English instruction into a reviewable contract.
- Let the user edit and approve that contract.
- Detect explained versus unexplained record changes deterministically.
- Show exact evidence for failures.
- Generate a precise repair instruction.
- Re-verify the corrected file and end in a clear success state.
- Stay visually aligned with the supplied art direction and storyboard references.[file:255][image:1]

## Constraints

- The app should remain a small end-to-end proof of concept suitable for hackathon judging rather than a broad platform.[cite:110][cite:113]
- Reliability claims must be limited to the deterministic verification layer.
- The contract compiler must be constrained by schema and editable by the user.
- Demo performance must be dependable enough for a 1–3 minute submission video, so heavy or unstable optional components should not be critical-path dependencies.[cite:113]

## Risks to control

- Contract compiler misinterprets ambiguous instructions.
- UI drifts into dashboard-template territory and loses distinctiveness.
- Product gets mistaken for a plain CSV diff tool.
- Scope expands into fuzzy matching or non-deterministic judgment.
- Repair flow overpromises by implying automatic fixing.

## Final scope verdict

Build one highly polished verification flow for CSV transformations only. Every feature that weakens deterministic trust, expands scope, or dilutes the cinematic verification story should be deferred.
