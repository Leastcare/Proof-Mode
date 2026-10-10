from tests.fixtures.make_fixtures import make_after_clean, make_after_bad_phone
from app.rules.normalize import check_normalize
from app.models.contract import NormalizationRule


def test_normalize_pass():
    r = check_normalize(make_after_clean(), "c4", "lbl", "phone", NormalizationRule.digits_only)
    assert r.passed
    assert r.fail_count == 0


def test_normalize_fail():
    r = check_normalize(make_after_bad_phone(), "c4", "lbl", "phone", NormalizationRule.digits_only)
    assert not r.passed
    assert r.fail_count == 1   # C001 still has +1 555 1234


def test_normalize_lowercase():
    import pandas as pd
    df = pd.DataFrame({"col": ["hello", "WORLD", "Mixed"]})
    r = check_normalize(df, "c4", "lbl", "col", NormalizationRule.lowercase)
    assert not r.passed
    assert r.fail_count == 2   # WORLD and Mixed fail (hello passes)
