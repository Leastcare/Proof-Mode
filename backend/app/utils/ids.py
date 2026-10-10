"""Entity-key set helpers."""
from __future__ import annotations

import pandas as pd


def unique_ids(df: pd.DataFrame, key: str) -> set[str]:
    """Return the set of unique non-null values in *key* column."""
    return set(df[key].dropna().astype(str).unique())


def ids_series(df: pd.DataFrame, key: str) -> pd.Series:
    """Return the key column as a string Series (nulls dropped)."""
    return df[key].dropna().astype(str)
