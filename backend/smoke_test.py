"""Quick end-to-end smoke test against a running backend."""
import json
import sys
import urllib.request
import urllib.parse

ASSETS = "../assets/demo-data"
BASE   = "http://localhost:8000"

CONTRACT = {
    "version": "1.0",
    "instruction": "Remove duplicates. Normalize phone numbers. Preserve every unique customer. Don't modify email addresses.",
    "entity_key": "customer_id",
    "status": "APPROVED",
    "clauses": [
        {"id": "c1", "type": "PRESERVE_ENTITY",  "label": "Preserve every unique customer_id.",
         "status_before_verification": "PROPOSED", "params": {"key": "customer_id"}},
        {"id": "c2", "type": "DEDUPE",           "label": "Remove duplicates by customer_id.",
         "status_before_verification": "PROPOSED", "params": {"key": "customer_id"}},
        {"id": "c3", "type": "NO_NEW_ENTITY",    "label": "No new customer_id may appear.",
         "status_before_verification": "PROPOSED", "params": {"key": "customer_id"}},
        {"id": "c4", "type": "NORMALIZE",        "label": "Phones to digits only.",
         "status_before_verification": "PROPOSED",
         "params": {"column": "phone", "rule": "digits_only"}},
        {"id": "c5", "type": "UNCHANGED_COLUMN", "label": "Email must not change.",
         "status_before_verification": "PROPOSED",
         "params": {"column": "email", "apply_to": "surviving_entities"}},
    ],
    "ambiguities": [],
    "compiler_notes": [],
}

def multipart(fields: dict, files: dict) -> tuple[bytes, str]:
    """Build a multipart/form-data body from fields and files."""
    import uuid
    boundary = uuid.uuid4().hex
    parts = []
    CRLF = b"\r\n"

    for name, value in fields.items():
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n'.encode()
            + value.encode() + CRLF
        )
    for name, (filename, data, ctype) in files.items():
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; '
            f'filename="{filename}"\r\nContent-Type: {ctype}\r\n\r\n'.encode()
            + data + CRLF
        )
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def post(url: str, fields: dict, files: dict) -> dict:
    body, content_type = multipart(fields, files)
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", content_type)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


def read_csv(path: str) -> bytes:
    with open(path, "rb") as f:
        return f.read()


def run():
    # ── Health ──────────────────────────────────────────────────────────────
    with urllib.request.urlopen(f"{BASE}/health") as r:
        health = json.loads(r.read())
    print(f"Health: {health}")

    # ── Compile (heuristic — no key needed) ─────────────────────────────────
    body, ct = multipart({"instruction": "Remove duplicates. Normalize phone numbers. Preserve customers."}, {})
    req = urllib.request.Request(f"{BASE}/compile-contract", data=body, method="POST")
    req.add_header("Content-Type", ct)
    with urllib.request.urlopen(req) as r:
        c = json.loads(r.read())
    print(f"\nCompile — entity_key: {c['entity_key']}, clauses: {len(c['clauses'])}")

    # ── Verify (broken) ──────────────────────────────────────────────────────
    before  = read_csv(f"{ASSETS}/customers_before.csv")
    broken  = read_csv(f"{ASSETS}/customers_after_broken.csv")
    fixed   = read_csv(f"{ASSETS}/customers_after_fixed.csv")

    result = post(
        f"{BASE}/verify",
        {"contract_json": json.dumps(CONTRACT)},
        {
            "original_file":    ("customers_before.csv",       before, "text/csv"),
            "transformed_file": ("customers_after_broken.csv", broken, "text/csv"),
        },
    )
    s = result["summary"]
    print(f"\n── /verify (broken) ──────────────────────────────────")
    print(f"  Overall status:     {s['overall_status']}")
    print(f"  Before rows:        {s['before_row_count']:,}")
    print(f"  After rows:         {s['after_row_count']:,}")
    print(f"  Explained removals: {s['explained_removals']:,}")
    print(f"  Unexplained losses: {s['unexplained_losses']:,}")
    print(f"  New entities:       {s['new_entities']:,}")
    print(f"  Clauses VERIFIED:   {s['verified_clause_count']}")
    print(f"  Clauses FAILED:     {s['failed_clause_count']}")
    print(f"  Evidence records:   {len(result['evidence'])}")
    print(f"  Highlighted IDs:    {result['highlighted_ids'][:3]}")
    print(f"  Repair instruction:\n    " +
          result["repair_instruction"].replace("\n", "\n    "))

    assert s["overall_status"]     == "FAILED",  f"Expected FAILED, got {s['overall_status']}"
    assert s["before_row_count"]   == 10_000
    assert s["after_row_count"]    == 9_863
    assert s["explained_removals"] == 94
    assert s["unexplained_losses"] == 43

    # ── Re-verify (fixed) ───────────────────────────────────────────────────
    result2 = post(
        f"{BASE}/reverify",
        {"contract_json": json.dumps(CONTRACT)},
        {
            "original_file":  ("customers_before.csv",      before, "text/csv"),
            "corrected_file": ("customers_after_fixed.csv", fixed,  "text/csv"),
        },
    )
    s2 = result2["summary"]
    print(f"\n── /reverify (fixed) ─────────────────────────────────")
    print(f"  Overall status:     {s2['overall_status']}")
    print(f"  Before rows:        {s2['before_row_count']:,}")
    print(f"  After rows:         {s2['after_row_count']:,}")
    print(f"  Unexplained losses: {s2['unexplained_losses']:,}")
    print(f"  Clauses VERIFIED:   {s2['verified_clause_count']}")
    print(f"  Clauses FAILED:     {s2['failed_clause_count']}")

    assert s2["overall_status"]     == "VERIFIED", f"Expected VERIFIED, got {s2['overall_status']}"
    assert s2["unexplained_losses"] == 0

    print("\n✓ All assertions passed.")


if __name__ == "__main__":
    try:
        run()
    except AssertionError as e:
        print(f"\n✗ Assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
