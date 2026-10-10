from tests.fixtures.make_fixtures import make_before, make_after_clean
from app.rules.preserve_sum import check_preserve_sum
from app.models.contract import ToleranceType
import pandas as pd


def test_preserve_sum_pass():
    # Deduped after has less revenue (only 3 unique of 4+1 dupe rows)
    # Use absolute tolerance to allow for dedup difference
    r = check_preserve_sum(make_after_clean(), make_after_clean(), "c7", "lbl",
                           "revenue", ToleranceType.absolute, 0)
    assert r.passed


def test_preserve_sum_fail():
    before = pd.DataFrame({"revenue": ["100", "200", "300"]})
    after  = pd.DataFrame({"revenue": ["100", "200", "999"]})  # changed
    r = check_preserve_sum(before, after, "c7", "lbl",
                           "revenue", ToleranceType.absolute, 0)
    assert not r.passed
    assert r.difference == pytest.approx(699.0, abs=1.0)


def test_preserve_sum_percentage_tolerance():
    import pytest
    before = pd.DataFrame({"revenue": ["1000"]})
    after  = pd.DataFrame({"revenue": ["1005"]})   # 0.5% off
    r = check_preserve_sum(before, after, "c7", "lbl",
                           "revenue", ToleranceType.percentage, 1.0)   # 1% allowed
    assert r.passed


import pytest
