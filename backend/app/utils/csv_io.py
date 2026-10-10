"""CSV loading and validation utilities."""
from __future__ import annotations

import io
from typing import Optional

import pandas as pd
from fastapi import HTTPException, UploadFile


async def read_upload_file(file: UploadFile) -> bytes:
    """Read an UploadFile fully into memory."""
    contents = await file.read()
    await file.seek(0)
    return contents


def parse_csv(data: bytes, filename: str = "file") -> pd.DataFrame:
    """
    Parse raw CSV bytes into a DataFrame.
    Raises HTTP 422 with a descriptive message on failure.
    """
    if not data:
        raise HTTPException(status_code=422, detail=f"{filename}: file is empty.")
    try:
        df = pd.read_csv(io.BytesIO(data), dtype=str, keep_default_na=False)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"{filename}: could not parse as CSV — {exc}",
        )
    if df.empty:
        raise HTTPException(status_code=422, detail=f"{filename}: CSV contains no rows.")
    return df


def validate_column_exists(df: pd.DataFrame, column: str, filename: str = "file") -> None:
    """Raise HTTP 422 if a required column is absent from the dataframe."""
    if column not in df.columns:
        raise HTTPException(
            status_code=422,
            detail=f"{filename}: required column '{column}' not found. "
                   f"Available columns: {list(df.columns)}",
        )


def validate_contract_columns(
    before: pd.DataFrame,
    after: pd.DataFrame,
    entity_key: Optional[str],
    clause_columns: list[str],
) -> None:
    """
    Verify that the entity key and all clause-referenced columns are present
    in both DataFrames before running any rules.
    """
    all_needed = list(clause_columns)
    if entity_key:
        all_needed.insert(0, entity_key)

    for col in all_needed:
        validate_column_exists(before, col, "original CSV")
        validate_column_exists(after, col, "transformed CSV")


def dataframe_to_records(df: pd.DataFrame) -> list[dict]:
    """Convert a DataFrame to a list of plain string dicts (for evidence payloads)."""
    return df.where(pd.notna(df), None).to_dict(orient="records")  # type: ignore[return-value]


def get_column_names(data: bytes) -> list[str]:
    """Return just the header row from CSV bytes without parsing the full file."""
    try:
        df = pd.read_csv(io.BytesIO(data), nrows=0, dtype=str)
        return list(df.columns)
    except Exception:
        return []
