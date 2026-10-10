"""Generate in-memory DataFrames for tests."""
import pandas as pd


def make_before() -> pd.DataFrame:
    return pd.DataFrame({
        "customer_id": ["C001", "C002", "C003", "C003", "C004"],
        "name":        ["Alice", "Bob", "Carol", "Carol", "Dave"],
        "email":       ["a@x.com", "b@x.com", "c@x.com", "c@x.com", "d@x.com"],
        "phone":       ["+1 555 1234", "555-5678", "(555)9012", "(555)9012", "5553456"],
        "revenue":     ["100.0", "200.0", "300.0", "300.0", "400.0"],
    })


def make_after_clean() -> pd.DataFrame:
    """Correct transformation: deduped, phone normalised, all entities preserved."""
    return pd.DataFrame({
        "customer_id": ["C001", "C002", "C003", "C004"],
        "name":        ["Alice", "Bob", "Carol", "Dave"],
        "email":       ["a@x.com", "b@x.com", "c@x.com", "d@x.com"],
        "phone":       ["15551234", "5555678", "5559012", "5553456"],
        "revenue":     ["100.0", "200.0", "300.0", "400.0"],
    })


def make_after_missing_entity() -> pd.DataFrame:
    """C004 is silently deleted — PRESERVE_ENTITY should fail."""
    return pd.DataFrame({
        "customer_id": ["C001", "C002", "C003"],
        "name":        ["Alice", "Bob", "Carol"],
        "email":       ["a@x.com", "b@x.com", "c@x.com"],
        "phone":       ["15551234", "5555678", "5559012"],
        "revenue":     ["100.0", "200.0", "300.0"],
    })


def make_after_new_entity() -> pd.DataFrame:
    """C999 is introduced — NO_NEW_ENTITY should fail."""
    return pd.DataFrame({
        "customer_id": ["C001", "C002", "C003", "C004", "C999"],
        "name":        ["Alice", "Bob", "Carol", "Dave", "Ghost"],
        "email":       ["a@x.com", "b@x.com", "c@x.com", "d@x.com", "g@x.com"],
        "phone":       ["15551234", "5555678", "5559012", "5553456", "0000000"],
        "revenue":     ["100.0", "200.0", "300.0", "400.0", "999.0"],
    })


def make_after_bad_phone() -> pd.DataFrame:
    """C001 phone still has non-digits — NORMALIZE should fail."""
    return pd.DataFrame({
        "customer_id": ["C001", "C002", "C003", "C004"],
        "name":        ["Alice", "Bob", "Carol", "Dave"],
        "email":       ["a@x.com", "b@x.com", "c@x.com", "d@x.com"],
        "phone":       ["+1 555 1234", "5555678", "5559012", "5553456"],
        "revenue":     ["100.0", "200.0", "300.0", "400.0"],
    })


def make_after_changed_email() -> pd.DataFrame:
    """C002 email is changed — UNCHANGED_COLUMN should fail."""
    return pd.DataFrame({
        "customer_id": ["C001", "C002", "C003", "C004"],
        "name":        ["Alice", "Bob", "Carol", "Dave"],
        "email":       ["a@x.com", "CHANGED@x.com", "c@x.com", "d@x.com"],
        "phone":       ["15551234", "5555678", "5559012", "5553456"],
        "revenue":     ["100.0", "200.0", "300.0", "400.0"],
    })


def make_after_new_null() -> pd.DataFrame:
    """C003 email is now null — NO_NEW_NULLS should fail."""
    return pd.DataFrame({
        "customer_id": ["C001", "C002", "C003", "C004"],
        "name":        ["Alice", "Bob", "Carol", "Dave"],
        "email":       ["a@x.com", "b@x.com", "", "d@x.com"],
        "phone":       ["15551234", "5555678", "5559012", "5553456"],
        "revenue":     ["100.0", "200.0", "300.0", "400.0"],
    })
