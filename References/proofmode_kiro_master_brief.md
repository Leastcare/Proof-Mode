# ProofMode — Kiro Master Build Brief

## Project goal

Build **ProofMode**, a premium web application that verifies whether an AI-transformed CSV dataset obeyed a user-approved, machine-checkable contract. The product should not claim that AI output is globally “correct.” It should only verify what can be proven deterministically and explicitly mark anything outside that scope as **CAN'T VERIFY**.

This direction fits the Build With AI: Basics challenge well because the event emphasizes building a small, working proof of concept end to end, requires `scope.md`, `prd.md`, and `spec.md` in the repository, and judges submissions on Design, Potential Impact, Innovation/Idea, and Presentation.[cite:110][cite:113]

## Core product philosophy

### One-line pitch

**ProofMode**  
**AI said it completed the task. Prove it.**

### Product truth

The system has two very different reliability levels:

- **Contract compiler:** assistive, not authoritative.
- **Deterministic verifier:** authoritative within a narrow schema.

The architecture must make this distinction visible.

### Trust principle

Use this sentence everywhere internally:

> ProofMode verifies whether an AI transformation obeyed a user-approved, machine-checkable contract — and refuses to claim anything it cannot prove.

### Non-negotiable rule

The LLM must **never** directly decide whether the transformed dataset is correct. The LLM may only propose a structured contract from natural language. The user must review and confirm that contract before verification begins.

## Best framing for judges

Do **not** pitch this as:

- “an LLM judge”
- “an AI evaluator”
- “a CSV diff tool”

Pitch it as:

> AI is increasingly transforming data for people. ProofMode checks whether the transformation actually followed the user’s instructions, with deterministic proof for every verdict.

That positioning matters because existing tools already compare dataframes and validate data contracts, but they do not package the full consumer workflow of instruction-to-contract, proof, repair instruction, and recheck for a non-engineer.[cite:236][cite:237][cite:242][cite:253]

## Submission recommendation

Build the **hybrid** version, not the original broad ProofMode and not a plain TransformGuard clone.

### Why this hybrid is stronger

- It keeps the most defensible part of TransformGuard: deterministic verification.
- It keeps the strongest part of ProofMode: product framing around intent and proof.
- It avoids the biggest weakness of original ProofMode: “LLM judging LLM.”
- It avoids the biggest weakness of a raw CSV diff: weak novelty framing.

## Exact MVP

### Scope

Version 1 verifies **CSV transformations only**.

Inputs:
- Original CSV (`before.csv`)
- AI-transformed CSV (`after.csv`)
- Natural-language instruction

Outputs:
- Suggested contract
- User-approved contract
- Deterministic verification results
- Evidence for each failed or passed rule
- Repair instruction
- Re-verification result

### The one core interaction

1. User uploads original and transformed CSV files.
2. User pastes the instruction they gave to AI.
3. The contract compiler proposes a structured contract.
4. The user reviews or edits the contract.
5. ProofMode runs deterministic verification.
6. ProofMode shows reconciliation and proof.
7. ProofMode generates a repair instruction.
8. User applies that instruction in their AI tool.
9. User uploads corrected CSV.
10. ProofMode re-verifies and shows the final result.

### The intended emotional beat

The demo must create this exact reaction:

> “The output looked fine — but 43 customers disappeared, and this product proved it.”

## What NOT to build

Do not build these in the hackathon MVP:

- PDF verification
n- DOCX verification
- code verification
- research-answer verification
- browser extension
- authentication
- teams / collaboration
- database-heavy persistence
- fuzzy duplicate merges
- semantic “customer correctness” checks
- auto-editing of files
- fully autonomous fixing
- arbitrary natural-language rules beyond the closed schema
- giant scoring systems like “87.3% correct”

Do not build `MERGED_INTO` logic in the MVP. It invites fuzzy entity resolution and ambiguity.

## Reliability boundary

### High-confidence deterministic parts

These can be treated as highly reliable when implemented correctly:

- CSV parsing
- exact key comparison
- duplicate-group detection by exact key
- regex normalization checks
- null-count comparison
- aggregate sum comparison with explicit tolerance rules
- exact unchanged-column comparison
- row-count threshold checks
- evidence extraction for missing IDs and mismatched rows
- result schema validation

### Low-confidence or out-of-scope parts

These must not be claimed as reliable:

- fuzzy entity matching
- inferred merges
- semantic correctness of records
- ambiguous user language without clarification
- open-ended concepts like “make customers correct”

### UX consequence

The product must use exactly three states:

- **VERIFIED**
- **FAILED**
- **CAN'T VERIFY**

Never use a fuzzy confidence score as the main product truth.

## Contract language

The contract language must be closed and schema-validated.

### Supported clause types

- `PRESERVE_ENTITY`
- `DEDUPE`
- `NO_NEW_ENTITY`
- `NORMALIZE`
- `NO_NEW_NULLS`
- `PRESERVE_SUM`
- `UNCHANGED_COLUMN`
- `ROW_COUNT_RANGE`

### Example contract JSON

```json
{
  "entity_key": "customer_id",
  "clauses": [
    {
      "type": "PRESERVE_ENTITY",
      "key": "customer_id"
    },
    {
      "type": "DEDUPE",
      "key": "customer_id"
    },
    {
      "type": "NO_NEW_ENTITY",
      "key": "customer_id"
    },
    {
      "type": "NORMALIZE",
      "column": "phone",
      "rule": "digits_only"
    },
    {
      "type": "UNCHANGED_COLUMN",
      "column": "email"
    }
  ]
}
```

### Contract compiler rules

The compiler may:
- map natural language to the closed clause vocabulary
- suggest keys and columns
- suggest normalization rules
- mark uncertainty when intent is ambiguous

The compiler may **not**:
- emit custom code
- invent new clause types
- output unverifiable natural-language checks
- directly issue pass/fail verdicts on the dataset

### Ambiguity handling

If the instruction is ambiguous, the system must ask a clarifying question or surface an editable selection.

Example:

User instruction:
> Remove duplicate customers.

Bad behavior:
> dedupe by customer_id automatically and proceed

Correct behavior:
> Duplicate by which field?
> - customer_id
> - email
> - phone
> - custom field

## Verification engine behavior

The verifier is deterministic and should be implemented in Python.

### Recommended stack

- Python 3.11+
- FastAPI for API endpoints and file handling.[cite:263][cite:265]
- Pandas for CSV loading and row-level checks.
- Pydantic for contract schemas and response models.
- Pytest for deterministic test coverage.

### Why Python

Python is the right choice because the core task is data verification rather than generic UI scripting. Pandas-style dataframe handling and exact row reconciliation are a natural fit for the product’s needs, and DataComPy demonstrates the strength of dataframe-comparison workflows in Python ecosystems.[cite:237][cite:242]

## Verification rules

### 1. Preserve entity

Definition:
Every unique entity key in `before` must exist in `after`, unless explicitly justified by another allowed clause such as exact-key deduplication.

Deterministic method:
- compute `before_unique_ids`
- compute `after_ids`
- report missing IDs

### 2. Dedupe

Definition:
Duplicate rows based on a specific key may be removed.

Deterministic method:
- identify duplicate groups in `before`
- compute maximum allowable removals from exact duplicate groups
- distinguish explained removals from unexplained losses

### 3. No new entity

Definition:
No entity key may appear in `after` if it did not exist in `before`.

Deterministic method:
- compute `after_ids - before_ids`

### 4. Normalize

Definition:
A column must satisfy an explicit transformation rule.

Supported MVP normalization rules:
- `digits_only`
- `lowercase`
- `trim_whitespace`
- `uppercase`

### 5. No new nulls

Definition:
The transformation must not introduce additional null values in a given column.

### 6. Preserve sum

Definition:
The aggregate total of a numeric column must remain unchanged, optionally within an explicit tolerance.

### 7. Unchanged column

Definition:
For surviving entities, a given column must remain identical before and after transformation.

### 8. Row count range

Definition:
The output row count must be within a specified range or ratio.

## Reconciliation model

The key insight is not “some rows disappeared.” The key insight is **what happened to the removed rows**.

For MVP, use a conservative, exact accounting model:

- `SURVIVED`
- `LEGITIMATELY_REMOVED_DUPLICATE`
- `UNEXPLAINED_LOSS`
- `NEW_ENTITY`

Avoid inferred merge states for now.

### Recommended demo arithmetic

Do not demo only this:
- Before: 10,000
- After: 9,863
- Deleted: 137

That is too easy to dismiss as duplicate cleanup.

Instead structure the story like this:

- Original records: 10,000
- Output records: 9,863
- Legitimately removed duplicates: 94
- Unexplained losses: 43

Then surface:

> 43 customers have no valid fate.

That is the money screen.

## Repair step

The repair step must be honest.

ProofMode does **not** automatically repair the file.

It produces a **repair instruction** that the user can send to their AI tool.

### Correct UX

- Verification fails.
- ProofMode generates a repair instruction.
- User copies the instruction.
- User uses their preferred AI tool.
- User uploads the corrected CSV.
- ProofMode re-verifies.

### Example repair instruction

```text
Restore the 43 missing customer records.
Do not modify any other records.
Preserve all approved transformations.
Ensure every original customer_id exists in the corrected output.
Keep the same column structure and formats.
```

## UI direction from the attached spec

The attached art-direction spec and storyboard define a premium cinematic product direction. The frontend must respect that visual identity.

### Product mood

- forensic
- calm
- premium
- editorial
- intelligent
- trustworthy
- cinematic

### It must NOT feel like

- a dashboard template
- a spreadsheet utility
- an AI chat wrapper
- a bright SaaS admin panel
- a coding-tool prototype

### Core visual identity

- very dark background
- warm neutral highlights
- restrained semantic color
- serif hero typography
- clean sans for UI
- mono for evidence and data
- strong negative space
- minimal chrome
- data visuals treated as evidence artifacts, not chartjunk

### Recommended fonts

- Display: Instrument Serif or Cormorant Garamond
- UI sans: Inter, Geist, or Satoshi
- Mono: IBM Plex Mono or Geist Mono

Recommended combination for implementation:
- Instrument Serif
- Inter
- IBM Plex Mono

### Color philosophy

Use color semantically and sparingly:
- off-white / bone for core text
- muted gray for supporting UI
- soft green for verified
- muted red/orange for failed or attention
- amber/neutral for cannot verify

Avoid loud Tailwind default greens and reds.

### Motion philosophy

Motion should explain transition of state.

Good motion:
- step transitions
- counter animation for counts
- field-level reveal
- evidence-card focus transitions
- calm progress motion during verification

Bad motion:
- decorative floating gradients
- constant ambient noise animation
- flashy generic SaaS animations

## Storyboard-based screen plan

Build the flow as a guided sequence, not a general dashboard.

### Screen 1 — Landing hero
Headline:
> Did it actually do what you asked?

Subhead:
> ProofMode verifies that AI transformations follow your instructions — every record accounted for.

CTA:
> Try a verification

### Screen 2 — Upload
Two file cards:
- original CSV
- AI output CSV

### Screen 3 — Set contract
Show:
- original instruction
- extracted clauses
- editable contract chips or rows

### Screen 4 — Verification in progress
Show live-feeling but deterministic progress states:
- reading files
- parsing records
- matching entities
- checking duplicates
- validating clauses

### Screen 5 — Verification results
Main number-led reveal:
- 9,863 records remain
- 137 fewer than the original

### Screen 6 — Unexplained records
Hero failure reveal:
- 43 records have no valid fate

### Screen 7 — Record evidence view
Focused per-record proof panel:
- present in original
- absent in transformed
- not part of valid duplicate removal
- not permitted by contract

### Screen 8 — Explained duplicate reference
Counterbalance the failure by showing legitimate removals.

### Screen 9 — Generate repair instruction
Show calm, precise repair instruction.

### Screen 10 — Re-verify upload
Upload corrected file.

### Screen 11 — Final verification
- 10,000 / 10,000
- all records accounted for

### Screen 12 — Success
Single-word close:
> Verified.

## Recommended application stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS with custom tokens
- Motion for React for staged transitions and presence animations.[cite:264][cite:268]
- SVG for custom evidence visuals

### Backend

- FastAPI
- Pandas
- Pydantic
- Uvicorn

### Tests

- Pytest
- fixture-based CSV test cases
- mutation tests for seeded failures

### Optional helpers

- DataComPy can be studied for comparison ideas but should not become the product UI or product definition.[cite:237][cite:253]

## Why not Streamlit

Do not use Streamlit as the primary hackathon build. It may speed up backend demonstration, but it will fight the premium, cinematic, screen-driven UI direction from the attached spec and storyboard.

## Suggested folder structure

```text
proofmode/
├── README.md
├── scope.md
├── prd.md
├── spec.md
├── assets/
│   ├── ui/
│   │   ├── ProofMode_UI_Art_Direction_Spec.md
│   │   └── ProofMode-Verification-Storyboard.jpg
│   ├── demo-data/
│   │   ├── customers_before.csv
│   │   ├── customers_after_broken.csv
│   │   └── customers_after_fixed.csv
│   └── branding/
│       └── logo/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── UploadPage.tsx
│   │   │   ├── ContractPage.tsx
│   │   │   ├── VerifyProgressPage.tsx
│   │   │   ├── ResultsPage.tsx
│   │   │   ├── EvidencePage.tsx
│   │   │   ├── RepairPage.tsx
│   │   │   ├── ReverifyPage.tsx
│   │   │   └── SuccessPage.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── contract/
│   │   │   ├── evidence/
│   │   │   ├── verification/
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── format.ts
│   │   │   └── constants.ts
│   │   ├── styles/
│   │   │   ├── tokens.css
│   │   │   ├── globals.css
│   │   │   └── motion.css
│   │   └── types/
│   │       ├── contract.ts
│   │       └── verification.ts
│   └── public/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── routes_compile.py
│   │   │   ├── routes_verify.py
│   │   │   ├── routes_repair.py
│   │   │   └── routes_reverify.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── logging.py
│   │   ├── models/
│   │   │   ├── contract.py
│   │   │   └── verification.py
│   │   ├── services/
│   │   │   ├── contract_compiler.py
│   │   │   ├── verifier.py
│   │   │   ├── reconciliation.py
│   │   │   ├── evidence_builder.py
│   │   │   └── repair_instruction.py
│   │   ├── rules/
│   │   │   ├── preserve_entity.py
│   │   │   ├── dedupe.py
│   │   │   ├── no_new_entity.py
│   │   │   ├── normalize.py
│   │   │   ├── no_new_nulls.py
│   │   │   ├── preserve_sum.py
│   │   │   ├── unchanged_column.py
│   │   │   └── row_count_range.py
│   │   └── utils/
│   │       ├── csv_io.py
│   │       ├── ids.py
│   │       └── regex_rules.py
│   ├── tests/
│   │   ├── fixtures/
│   │   ├── test_contract_schema.py
│   │   ├── test_preserve_entity.py
│   │   ├── test_dedupe.py
│   │   ├── test_no_new_entity.py
│   │   ├── test_normalize.py
│   │   ├── test_no_new_nulls.py
│   │   ├── test_preserve_sum.py
│   │   ├── test_unchanged_column.py
│   │   ├── test_row_count_range.py
│   │   ├── test_reconciliation.py
│   │   └── test_mutations.py
│   └── requirements.txt
└── docs/
    ├── architecture.md
    ├── contract-language.md
    ├── api-spec.md
    ├── demo-script.md
    └── judge-defense.md
```

## Contracts and response schemas

### Contract schema guidance

Required top-level fields:
- `entity_key`
- `clauses`
- `ambiguities`
- `compiler_notes`

Each clause should include:
- `id`
- `type`
- `label`
- `status_before_verification` (`PROPOSED`)
- clause-specific parameters

### Verification response schema guidance

Each clause result should include:
- `clause_id`
- `type`
- `status` (`VERIFIED` | `FAILED` | `CANT_VERIFY`)
- `verification_mode` (`DETERMINISTIC`)
- `summary`
- `counts`
- `evidence_refs`

Top-level verification payload should include:
- original row count
- output row count
- explained removals
- unexplained losses
- new entities
- clause results
- highlighted entity IDs
- generated repair instruction

## Test strategy

### 1. Contract compilation tests

Create a test table of natural-language inputs and expected contracts.

Examples:

| Instruction | Expected clause |
|---|---|
| Remove duplicate emails | `DEDUPE(email)` |
| Keep every customer | `PRESERVE_ENTITY(customer_id)` |
| Don’t modify prices | `UNCHANGED_COLUMN(price)` |
| Phone numbers should contain digits only | `NORMALIZE(phone, digits_only)` |
| Don’t add customers | `NO_NEW_ENTITY(customer_id)` |
| Keep revenue unchanged | `PRESERVE_SUM(revenue)` |

Also test paraphrases like:
- don’t lose anyone
- retain every unique client
- strip phone formatting
- preserve all original customers

### 2. Mutation tests

Create known failure cases:

- Delete 43 legitimate customers → must fail.
- Add 10 fake customers → must fail.
- Corrupt 5 phone formats → must fail.
- Remove only valid duplicates → must pass.
- Introduce 20 new nulls → must fail.
- Change protected email values → must fail.

This is a powerful README and demo defense because it shows the verifier catching seeded violations rather than merely looking plausible.

## Kiro verdict and instructions

### Likely Kiro verdict

Kiro should be a good fit for this project because it is strongest when the system has explicit specs, persistent project conventions, and implementation rules that must remain consistent. Kiro’s steering system is designed to preserve project conventions in markdown files across the IDE and agent workflows, rather than requiring repeated restatement of standards in chat.[cite:258][cite:260][cite:261]

Kiro would likely favor this project because:
- the verifier rules are explicit and bounded
- the contract language can be formalized
- the UI direction is documented
- the build can be broken into spec-driven tasks
- regression tests are central to correctness

### What to tell Kiro

After creating the folder structure, upload these into the repo:
- this markdown brief
- `ProofMode_UI_Art_Direction_Spec.md`
- `ProofMode-Verification-Storyboard.jpg`

Then tell Kiro something close to this:

```text
Read the uploaded markdown brief, the UI art direction spec, and the storyboard image first.
Treat them as binding project context.
This project is ProofMode: a React + FastAPI application that verifies whether an AI-transformed CSV obeyed a user-approved, machine-checkable contract.

Critical rules:
1. The LLM may only compile natural language into a closed contract schema.
2. The user must review and approve the contract before verification.
3. The verifier must be deterministic and implemented in Python.
4. If a claim cannot be proven, mark it CANT_VERIFY.
5. Do not implement fuzzy matching, inferred merges, or semantic correctness.
6. Do not turn this into a generic dashboard or chat app.
7. Match the uploaded UI art direction and storyboard closely.
8. Prioritize a spectacular end-to-end demo over broad scope.

Now do these in order:
- generate scope.md
- generate prd.md
- generate spec.md
- propose the backend contract schema
- propose the verification response schema
- propose the first milestone task breakdown
- propose the exact frontend page/component map
- propose the backend module implementation order
- propose the deterministic test plan
```

### Best use of Kiro features

Use Kiro steering files to lock:
- tech stack
- UI principles
- contract vocabulary
- verifier constraints
- non-goals
- testing expectations

This aligns with Kiro’s steering concept, which persists project guidance through markdown rather than relying on repeated prompting.[cite:258][cite:269]

## Build plan

### Phase 1 — foundation

- define contract schema
- define verification result schema
- create CSV fixtures
- implement exact rule checkers
- write tests first for verifier behavior

### Phase 2 — contract flow

- implement compiler output format
- add user contract editor / approval UI
- wire verifier to approved contract

### Phase 3 — cinematic UI

- implement stage-based screens from storyboard
- add motion transitions
- implement reconciliation and evidence cards

### Phase 4 — demo readiness

- preload demo data
- polish copy
- write README
- record 1–3 minute demo
- prepare judge-defense notes

## Judge attack and defense

### Likeliest attack

> Isn’t this just a CSV diff tool with AI dressing?

### Best defense

No. A diff tool tells you what changed. ProofMode verifies whether the change obeyed the user’s explicit intent by converting that intent into a bounded contract, then proving each clause deterministically with evidence.

### Second attack

> Isn’t the AI still judging the AI?

### Best defense

No. The AI only proposes the contract. The user approves it. Python code performs the verification. Every verdict is backed by deterministic evidence.

## Final recommendation

Build ProofMode as a **React + FastAPI** application with a **Python deterministic verification core** and a **cinematic, editorial UI** based on the attached spec and storyboard.

Keep the MVP narrow, proof-driven, and brutally honest about what it can and cannot verify. That honesty is one of the project’s strongest differentiators.
