"""
Generate the three demo CSV fixtures used by ProofMode.

  customers_before.csv       — 10,000 original records
  customers_after_broken.csv — 9,863 records (94 legit dupes removed, 43 silently deleted)
  customers_after_fixed.csv  — 10,000 records (all originals present, dupes removed)

Run from the backend directory:
  python generate_fixtures.py
"""
from __future__ import annotations

import csv
import os
import random
import re

random.seed(42)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "demo-data")
os.makedirs(OUT_DIR, exist_ok=True)

COLUMNS = ["customer_id", "name", "email", "phone", "city", "country", "created_at", "revenue"]

FIRST_NAMES = [
    "Priya","Arjun","Zara","Liam","Sofia","Noah","Amara","Ethan","Mei","Carlos",
    "Fatima","James","Ingrid","Ravi","Chloe","Omar","Yuki","Aisha","Lucas","Hannah",
    "Kofi","Elena","Marcus","Nadia","Diego","Freya","Tariq","Bianca","Felix","Astrid",
    "Emmanuel","Valentina","Jack","Leila","Samuel","Mia","Ahmed","Clara","Rajesh","Naomi",
    "Ivan","Grace","Ben","Hina","Dmitri","Yara","Patrick","Chiara","Kenji","Ayasha",
]
LAST_NAMES = [
    "Sharma","Mehta","Khan","Osei","Reyes","Tanaka","Diallo","Novak","Liu","Vega",
    "Al-Rashid","Okonkwo","Svensson","Patel","Martin","Farouk","Nakamura","Bello",
    "Ferreira","Schulz","Asante","Popescu","Webb","Ibragimova","Torres","Jensen",
    "Hussain","Romano","Nguyen","Berg","Osei","Cruz","Morrison","Tehrani","Adeyemi",
    "Kowalski","Saleh","Dupont","Kumar","Watanabe","Petrov","Okafor","Hartley",
    "Yamamoto","Silva","Müller","Santos","Kim","Andersen","Johansson",
]
CITIES = [
    "Mumbai","Lagos","Stockholm","London","São Paulo","Tokyo","Nairobi",
    "Berlin","Singapore","Cairo","Sydney","Toronto","Dubai","Amsterdam","Seoul",
]
COUNTRIES = [
    "India","Nigeria","Sweden","UK","Brazil","Japan","Kenya",
    "Germany","Singapore","Egypt","Australia","Canada","UAE","Netherlands","South Korea",
]


def random_phone_raw() -> str:
    """Unformatted phone with spaces/dashes — the AI should normalise these."""
    digits = "".join(str(random.randint(0, 9)) for _ in range(10))
    fmt = random.choice([
        f"+{digits[:2]} {digits[2:7]} {digits[7:]}",
        f"{digits[:3]}-{digits[3:6]}-{digits[6:]}",
        f"({digits[:3]}) {digits[3:6]}-{digits[6:]}",
        f"{digits}",
    ])
    return fmt


def phone_digits_only(raw: str) -> str:
    return re.sub(r"\D", "", raw)


def make_date(seed: int) -> str:
    year = 2022 + (seed % 3)
    month = (seed % 12) + 1
    day = (seed % 28) + 1
    return f"{year}-{month:02d}-{day:02d}"


def build_before() -> list[dict]:
    """
    Build 10,000 rows total:
    - 9,906 unique customers (IDs CUS-00001 to CUS-09906)
    - 94 exact duplicate rows for IDs CUS-00500 to CUS-00593
      (each of those 94 IDs appears exactly twice)
    Total: 9,906 unique + 94 duplicate copies = 10,000 rows
    """
    # IDs that will have duplicates
    dupe_ids = {f"CUS-{i:05d}" for i in range(500, 594)}

    rows = []
    for i in range(9_906):
        cid = f"CUS-{i + 1:05d}"
        fn  = FIRST_NAMES[i % len(FIRST_NAMES)]
        ln  = LAST_NAMES[(i * 7) % len(LAST_NAMES)]
        name  = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower().replace(' ', '')}_{i}@example.com"
        phone_raw = random_phone_raw()
        city    = CITIES[i % len(CITIES)]
        country = COUNTRIES[i % len(COUNTRIES)]
        date    = make_date(i)
        revenue = round(random.uniform(50, 5000), 2)
        rows.append({
            "customer_id": cid,
            "name":        name,
            "email":       email,
            "phone":       phone_raw,
            "city":        city,
            "country":     country,
            "created_at":  date,
            "revenue":     revenue,
        })

    # Insert 94 duplicate copies right after their originals
    final: list[dict] = []
    for r in rows:
        final.append(r)
        if r["customer_id"] in dupe_ids:
            final.append(dict(r))  # exact duplicate

    return final


def build_after_broken(before: list[dict]) -> list[dict]:
    """
    Simulate what a bad AI transformation produces:
    - Normalize all phones to digits only  ✓
    - The AI received a dataset that already had 94 duplicate customer_ids
      in the original (before). It deduped them correctly (94 rows removed) ✓
    - But it also silently deleted 43 unique customers                       ✗
    Result: 10,000 - 94 - 43 = 9,863 rows.
    """
    # The "before" file already contains 94 intentional duplicates
    # (rows 500-593 each appear twice). We simply normalise phones,
    # dedupe by customer_id (keep first), then drop 43 unique records.
    rows = [dict(r) for r in before]

    # Step 1: normalise phones
    for r in rows:
        r["phone"] = phone_digits_only(r["phone"])

    # Step 2: dedupe by customer_id (keep first occurrence)
    seen: set[str] = set()
    deduped: list[dict] = []
    for r in rows:
        cid = r["customer_id"]
        if cid not in seen:
            seen.add(cid)
            deduped.append(r)
    rows = deduped

    # Step 3: silently delete 43 unique customers (IDs 1800-1842)
    silently_deleted = {f"CUS-{i:05d}" for i in range(1800, 1843)}
    rows = [r for r in rows if r["customer_id"] not in silently_deleted]

    return rows


def build_after_fixed(before: list[dict]) -> list[dict]:
    """
    Corrected transformation:
    - Normalize phones  ✓
    - Dedupe (remove 94 duplicate rows)  ✓
    - All 43 originally-missing customers present  ✓
    Result: 10,000 - 94 = 9,906 unique rows.
    """
    rows = [dict(r) for r in before]

    for r in rows:
        r["phone"] = phone_digits_only(r["phone"])

    # Dedupe — keep first occurrence
    seen: set[str] = set()
    deduped: list[dict] = []
    for r in rows:
        cid = r["customer_id"]
        if cid not in seen:
            seen.add(cid)
            deduped.append(r)

    return deduped


def write_csv(path: str, rows: list[dict]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"  Written: {os.path.basename(path)}  ({len(rows):,} rows)")


if __name__ == "__main__":
    print("Generating ProofMode demo fixtures...")

    before = build_before()
    broken = build_after_broken(before)
    fixed  = build_after_fixed(before)

    write_csv(os.path.join(OUT_DIR, "customers_before.csv"),       before)
    write_csv(os.path.join(OUT_DIR, "customers_after_broken.csv"), broken)
    write_csv(os.path.join(OUT_DIR, "customers_after_fixed.csv"),  fixed)

    print(f"\nVerification counts:")
    print(f"  Before:  {len(before):,} rows  (9,906 unique + 94 duplicate rows)")
    print(f"  Broken:  {len(broken):,} rows  (9,906 - 94 deduped - 43 silently deleted = 9,863)")
    print(f"  Fixed:   {len(fixed):,} rows   (9,906 - 94 deduped, no losses)")
    print(f"\nFixtures written to: {OUT_DIR}")
