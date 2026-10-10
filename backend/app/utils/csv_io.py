"""CSV loading, encoding detection, and validation utilities."""
from __future__ import annotations

import io
from typing import Optional

import chardet
import pandas as pd
from fastapi import HTTPException, UploadFile

# ── Size limits ───────────────────────────────────────────────────────────────
MAX_FILE_BYTES = 50 * 1024 * 1024   # 50 MB hard limit
WARN_FILE_BYTES = 10 * 1024 * 1024  # 10 MB soft warning


async def read_upload_file(file: UploadFile) -> bytes:
    """Read an UploadFile fully into memory, enforcing the size limit."""
    contents = await file.read()
    await file.seek(0)

    if len(contents) > MAX_FILE_BYTES:
        mb = len(contents) / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=(
                f"{file.filename}: file is {mb:.1f} MB. "
                f"Maximum allowed size is {MAX_FILE_BYTES // (1024 * 1024)} MB. "
                "Consider splitting the file into smaller chunks."
            ),
        )
    return contents


def _detect_encoding(data: bytes) -> str:
    """Use chardet to detect the file encoding, falling back to utf-8."""
    if data[:3] == b"\xef\xbb\xbf":
        return "utf-8-sig"   # UTF-8 with BOM
    result = chardet.detect(data[:10_000])  # sample first 10KB for speed
    encoding = result.get("encoding") or "utf-8"
    confidence = result.get("confidence") or 0
    # If chardet is not confident, prefer utf-8
    if confidence < 0.6:
        encoding = "utf-8"
    return encoding


def _detect_delimiter(sample: str) -> str:
    """Detect CSV delimiter from the first few lines."""
    candidates = [",", ";", "\t", "|"]
    first_line = sample.split("\n")[0] if "\n" in sample else sample
    counts = {d: first_line.count(d) for d in candidates}
    return max(counts, key=counts.get)   # type: ignore[arg-type]


def parse_csv(data: bytes, filename: str = "file") -> pd.DataFrame:
    """
    Parse raw CSV bytes into a DataFrame.
    - Auto-detects encoding (handles UTF-8, UTF-8-BOM, Latin-1, Windows-1252, etc.)
    - Auto-detects delimiter (comma, semicolon, tab, pipe)
    - Returns HTTP 422 with a human-readable message on any parse failure.
    """
    if not data:
        raise HTTPException(status_code=422, detail=f"{filename}: file is empty.")

    # Detect encoding
    encoding = _detect_encoding(data)

    # Decode to string for delimiter detection
    try:
        text_sample = data[:4096].decode(encoding, errors="replace")
    except Exception:
        text_sample = data[:4096].decode("utf-8", errors="replace")

    delimiter = _detect_delimiter(text_sample)

    # Parse with detected settings
    for enc in [encoding, "utf-8", "latin-1", "cp1252"]:
        try:
            df = pd.read_csv(
                io.BytesIO(data),
                dtype=str,
                keep_default_na=False,
                encoding=enc,
                sep=delimiter,
                on_bad_lines="warn",
            )
            if df.empty:
                raise HTTPException(
                    status_code=422,
                    detail=f"{filename}: CSV parsed successfully but contains no rows."
                )
            return df
        except HTTPException:
            raise
        except Exception:
            continue

    raise HTTPException(
        status_code=422,
        detail=(
            f"{filename}: could not parse as CSV. "
            "Please ensure the file is a valid CSV with a consistent delimiter "
            "and a recognisable text encoding."
        ),
    )


def validate_column_exists(df: pd.DataFrame, column: str, filename: str = "file") -> None:
    """Raise HTTP 422 if a required column is absent."""
    if column not in df.columns:
        raise HTTPException(
            status_code=422,
            detail=(
                f"{filename}: required column '{column}' not found. "
                f"Available columns: {list(df.columns)}"
            ),
        )


def validate_contract_columns(
    before: pd.DataFrame,
    after: pd.DataFrame,
    entity_key: Optional[str],
    clause_columns: list[str],
) -> None:
    all_needed = list(clause_columns)
    if entity_key:
        all_needed.insert(0, entity_key)
    for col in all_needed:
        validate_column_exists(before, col, "original CSV")
        validate_column_exists(after,  col, "transformed CSV")


def dataframe_to_records(df: pd.DataFrame) -> list[dict]:
    return df.where(pd.notna(df), None).to_dict(orient="records")  # type: ignore[return-value]


def get_column_names(data: bytes) -> list[str]:
    """Return just the header row without parsing the full file."""
    try:
        encoding = _detect_encoding(data)
        sample = data[:4096].decode(encoding, errors="replace")
        delimiter = _detect_delimiter(sample)
        df = pd.read_csv(io.BytesIO(data), nrows=0, dtype=str,
                         encoding=encoding, sep=delimiter)
        return list(df.columns)
    except Exception:
        return []


def get_csv_preview(data: bytes, n_rows: int = 3) -> dict:
    """Return column names + first n rows for UI preview."""
    try:
        encoding = _detect_encoding(data)
        sample = data[:4096].decode(encoding, errors="replace")
        delimiter = _detect_delimiter(sample)
        df = pd.read_csv(io.BytesIO(data), nrows=n_rows, dtype=str,
                         keep_default_na=False, encoding=encoding, sep=delimiter)
        return {
            "columns": list(df.columns),
            "row_count_preview": len(df),
            "sample_rows": df.to_dict(orient="records"),
            "encoding_detected": encoding,
            "delimiter_detected": delimiter,
        }
    except Exception as e:
        return {"columns": [], "row_count_preview": 0, "sample_rows": [],
                "error": str(e)}
