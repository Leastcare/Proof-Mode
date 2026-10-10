from tests.fixtures.make_fixtures import make_before, make_after_clean
from app.rules.dedupe import check_dedupe


def test_dedupe_pass():
    r = check_dedupe(make_before(), make_after_clean(), "c2", "lbl", "customer_id")
    assert r.passed
    assert r.total_actual_removed == 1   # one copy of C003 removed
    assert "C003" in r.duplicate_ids


def test_dedupe_no_duplicates():
    r = check_dedupe(make_after_clean(), make_after_clean(), "c2", "lbl", "customer_id")
    assert r.passed
    assert r.total_actual_removed == 0
