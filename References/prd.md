# ProofMode PRD

## Overview

ProofMode is a premium verification product for AI-transformed CSV data. Users provide the original file, the AI-transformed file, and the instruction they gave to AI. ProofMode converts that instruction into a constrained contract, asks the user to confirm it, and then deterministically verifies whether the output obeyed the approved rules. The product does not act as a generic LLM judge. It only certifies claims that can be proven through code and exposes ambiguity when it cannot.[cite:236][cite:237][cite:242]

## Product vision

**AI said it completed the task. Prove it.**

The long-term vision is a trust layer for AI-performed transformations. The hackathon version focuses on the narrowest, most defensible wedge: structured CSV transformations with evidence-backed verification.

## Why now

AI-assisted spreadsheet and table transformations are increasingly common, but end users often lack a reliable way to tell whether an apparently clean output silently violated instructions. Established tools such as Great Expectations and DataComPy show that deterministic checks around uniqueness, row integrity, and table comparison are technically strong, but they remain engineering-oriented and do not provide the full end-user loop of instruction understanding, contract approval, proof, repair instruction, and recheck.[cite:236][cite:237][cite:242][cite:253]

## Hackathon fit

Build With AI: Basics asks participants to create a new project, use the required skill pack, ship a working app, include `scope.md`, `prd.md`, and `spec.md`, and present it clearly in a short demo. The judging criteria equally weight Design, Potential Impact, Innovation/Idea, and Presentation, which rewards a compact, highly polished, memorable loop more than a large or infrastructure-heavy build.[cite:110][cite:113]

## Users

### Primary user

A technically comfortable but non-expert data worker, student, analyst, founder, operator, or freelancer who uses AI to clean or transform CSV-like data and wants to verify that the transformation followed explicit instructions.

### Secondary user

A developer, QA-oriented user, or operations person who wants quick proof that a machine-generated dataset did not silently lose or alter critical records.

## Jobs to be done

- “I asked AI to clean this file. Did it actually follow my instructions?”
- “Show me exactly which records are missing or invalid.”
- “Separate legitimate duplicate removals from suspicious losses.”
- “Give me a precise instruction I can send back to the AI to fix only what failed.”
- “Let me recheck the corrected file and confirm everything is accounted for.”

## Product principles

1. **Proof over opinion.** Use code-backed evidence, not model confidence theater.
2. **Human-approved contract.** The compiler suggests; the user decides.
3. **Deterministic authority.** Only deterministic checks can produce authoritative verdicts.
4. **Explicit uncertainty.** Anything outside the supported schema is `CANT_VERIFY`.
5. **Single spectacular loop.** Optimize for one unforgettable end-to-end experience.
6. **Premium clarity.** The UI must feel forensic, calm, and intentional, not like a spreadsheet utility or template dashboard.[file:255][image:1]

## Problem details

### Current pain

Users can see that an output looks cleaner, but they often cannot easily answer:
- Were all original entities preserved?
- Were duplicates removed for the right reason?
- Were protected columns modified?
- Were new entities introduced?
- Did the transformation preserve required totals?

### Existing alternatives

- Manual spreadsheet inspection: slow and error-prone.
- Diff tools: useful for structural differences but weak on user intent.[cite:237][cite:253]
- Data-quality frameworks: powerful but engineering-centric and not packaged as a guided consumer verification workflow.[cite:236][cite:251]
- Asking AI to self-review: vulnerable to the “LLM judging LLM” critique and harder to trust.[cite:221][cite:225]

## Product solution

ProofMode solves this by separating the uncertain part from the authoritative part:

1. Natural-language instruction is compiled into a bounded contract.
2. User reviews and edits the contract.
3. Deterministic verifier checks the transformed dataset against the approved contract.
4. Results are presented as verification outcomes with evidence.
5. A repair instruction is generated for a second pass.
6. The corrected file is re-uploaded and rechecked.

## MVP feature set

### 1. File upload

Users upload:
- original CSV
- transformed CSV

The system reads these as form-based file uploads. FastAPI’s `UploadFile` is suited to this because it supports file metadata and file-like access patterns without requiring the entire file to be handled as a raw bytes blob.[cite:263][cite:265][cite:277]

### 2. Instruction input

Users paste the original instruction they gave to AI.

Example:
> Clean this customer dataset. Remove duplicates. Normalize phone numbers. Preserve every unique customer. Do not modify email addresses.

### 3. Contract compiler

The compiler converts the instruction into a proposed JSON contract using a closed vocabulary.

Supported clauses:
- `PRESERVE_ENTITY`
- `DEDUPE`
- `NO_NEW_ENTITY`
- `NORMALIZE`
- `NO_NEW_NULLS`
- `PRESERVE_SUM`
- `UNCHANGED_COLUMN`
- `ROW_COUNT_RANGE`

The compiler must never output arbitrary code or custom verifier logic.

### 4. Contract review UI

Users must be able to:
- inspect each proposed clause,
- edit fields like entity key or protected column,
- resolve ambiguities,
- approve the contract before verification begins.

### 5. Deterministic verification engine

The verifier checks:
- entity preservation,
- exact duplicate removals,
- new entities,
- normalization compliance,
- null increases,
- sum preservation,
- unchanged columns,
- row-count bounds.

### 6. Reconciliation view

The key output is not just “rows changed.” It is **accounted-for vs unaccounted-for outcomes**.

Recommended categories for MVP:
- `SURVIVED`
- `LEGITIMATELY_REMOVED_DUPLICATE`
- `UNEXPLAINED_LOSS`
- `NEW_ENTITY`

### 7. Evidence view

Users can inspect the proof behind a failure or pass, including original IDs, missing IDs, field-level checks, duplicate groups, and protected-field changes.

### 8. Repair instruction generation

The system creates a precise textual instruction for the user to send back to their AI tool. It does not automatically fix the file.

### 9. Re-verification

Users upload the corrected CSV and run the same approved contract again.

## User flow

1. Land on ProofMode hero.
2. Start verification.
3. Upload original and transformed files.
4. Paste AI instruction.
5. Review and approve proposed contract.
6. Run verification.
7. See reconciliation summary.
8. Drill into unexplained losses and supporting evidence.
9. Generate repair instruction.
10. Upload corrected file.
11. Re-run verification.
12. Reach verified state.

## UX and visual direction

The attached design references establish the intended product identity. The interface should feel cinematic, editorial, and evidence-led, with strong typography, sparse chrome, restrained semantic color, and a focused step-by-step journey rather than a dense software dashboard.[file:255][image:1]

### Visual characteristics

- Dark, premium backdrop.
- Large serif headline moments.
- Clear, quiet sans-serif UI scaffolding.
- Monospace evidence zones.
- Sparse but meaningful color.
- Motion used to reveal state transitions and record accounting.

### Anti-goals for design

- No generic SaaS template look.
- No always-visible spreadsheet grid as the primary identity.
- No chat UI.
- No fake AI confidence percentages.
- No rainbow data visualization.

## Key use case for demo

The anchor demo should use a carefully prepared example where:
- original file has 10,000 records,
- transformed file has 9,863 records,
- 94 removals are legitimate duplicates,
- 43 customer IDs have no valid explanation.

The strongest reveal is:
> 43 records have no valid fate.

That is more compelling than a generic “137 deletions detected” message because it distinguishes intentional transformations from unexplained violations.

## Requirements

### Functional requirements

- The user can upload two CSVs.
- The user can enter a transformation instruction.
- The system can propose a contract from supported clause types.
- The user can edit and approve that contract.
- The system can verify the transformed file against the contract.
- The system can label each clause `VERIFIED`, `FAILED`, or `CANT_VERIFY`.
- The system can show deterministic evidence for each clause result.
- The system can generate a repair instruction.
- The user can upload a corrected file and rerun verification.

### Non-functional requirements

- The verifier must be deterministic for all supported clause types.
- The app must feel stable and demo-ready within a 1–3 minute presentation window.[cite:113]
- The UI must visually align with the provided references.[file:255][image:1]
- The contract schema must be validated.
- The result payload must be typed and structured.
- The app must degrade honestly when ambiguity exists.

## Success metrics

### Demo success

- The product clearly explains what it is within 15 seconds.
- The demo reveals a meaningful hidden failure.
- The evidence view makes the failure undeniable.
- The repair-and-recheck loop resolves the failure visibly.
- The final verified state feels conclusive and satisfying.

### Product success

- Users understand the contract before verification.
- Users trust the result because it shows evidence.
- Judges perceive the product as more than a CSV diff tool.
- Judges do not reduce it to “AI judging AI.”

## Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Contract compiler misreads intent | Wrong contract undermines trust | Human approval gate, closed vocabulary, schema validation |
| Product looks like CSV diff | Weak innovation score | Lead with intent, contract, and proof-driven reconciliation |
| UI becomes generic dashboard | Reduces memorability | Follow supplied art direction closely [file:255][image:1] |
| Scope expands too far | Hurts execution quality | CSV-only MVP, no fuzzy logic |
| Repair step sounds autonomous | Risks overclaiming | Frame it as repair instruction generation only |

## Recommended stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS with custom design tokens
- Motion for React for transitions and staged reveals.[cite:264]

### Backend

- Python
- FastAPI
- Pandas
- Pydantic

### Testing

- Pytest
- Fixture-based deterministic tests
- Mutation cases for seeded failures

### Agent workflow

Use Kiro steering files in `.kiro/steering/` to preserve product overview, technology choices, project structure, constraints, and implementation rules across sessions.[cite:258][cite:274][cite:276]

## Release boundary

The hackathon release is complete when:
- `scope.md`, `prd.md`, and `spec.md` exist in the repo,[cite:113]
- the app runs end to end,
- the core demo data is prepared,
- the main verification flow is polished,
- the verifier has tests for each supported clause,
- the README explains what is deterministic and what is not.

## Final PRD decision

ProofMode should be built as a narrow, elegant trust layer for AI-transformed CSV data. It wins not by claiming to understand everything, but by proving exactly what happened and refusing to bluff when it cannot know.
