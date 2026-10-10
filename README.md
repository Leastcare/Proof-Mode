# ProofMode

**AI said it cleaned your data. ProofMode proves whether it did.**

ProofMode verifies that an AI-transformed CSV dataset obeyed your original instructions — every record accounted for, every verdict backed by deterministic evidence.

---

## How it works

1. **Upload** your original CSV and the AI-transformed output
2. **Approve** a machine-checkable contract compiled from your plain-English instruction
3. **Verify** — a deterministic Python engine checks each clause
4. **Inspect** exact evidence for any failure (missing IDs, changed values, format violations)
5. **Repair** — copy a precise fix instruction, send it back to your AI tool, re-verify

> AI proposes. Human approves. Code verifies.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS + Motion |
| Backend | FastAPI + Pandas + Pydantic + Python 3.11 |
| Contract compiler | OpenAI (optional) with heuristic fallback |
| Verification | Deterministic Python rule engine |

---

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # add OPENAI_API_KEY if you want LLM compilation
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### Demo data

```bash
cd backend
python generate_fixtures.py
```

Generates three CSV fixtures in `assets/demo-data/`:
- `customers_before.csv` — 10,000 rows
- `customers_after_broken.csv` — 9,863 rows (94 legit dupes removed, 43 silently deleted)
- `customers_after_fixed.csv` — 9,906 rows (all originals present)

---

## Supported contract clauses

| Clause | What it checks |
|---|---|
| `PRESERVE_ENTITY` | Every unique entity key must remain |
| `DEDUPE` | Duplicate rows by key may be removed |
| `NO_NEW_ENTITY` | No new entity keys may be introduced |
| `NORMALIZE` | Column values must conform to a format rule |
| `NO_NEW_NULLS` | No new null values may be introduced |
| `PRESERVE_SUM` | Aggregate total must stay within tolerance |
| `UNCHANGED_COLUMN` | Protected column values must not change |
| `ROW_COUNT_RANGE` | Output row count must stay within a ratio range |

---

## Verification states

- `VERIFIED` — deterministic check passed
- `FAILED` — deterministic check failed with evidence
- `CANT_VERIFY` — outside the supported schema, explicitly flagged

ProofMode never guesses. If it cannot prove it, it will not say it passed.

---

## Project docs

- [`scope.md`](References/scope.md) — what is and isn't in scope
- [`prd.md`](References/prd.md) — product requirements
- [`spec.md`](References/spec.md) — implementation specification

---

Built for the **Build With AI: Basics** hackathon.
