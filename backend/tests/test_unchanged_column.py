from tests.fixtures.make_fixtures import make_before, make_after_clean, make_after_changed_email
from app.rules.unchanged_column import check_unchanged_column


def test_unchanged_column_pass():
    r = check_unchanged_column(make_before(), make_after_clean(), "c5", "lbl", "email", "customer_id")
    assert r.passed
    assert r.change_count == 0


def test_unchanged_column_fail():
    r = check_unchanged_column(make_before(), make_after_changed_email(), "c5", "lbl", "email", "customer_id")
    assert not r.passed
    assert r.change_count == 1
    assert any(c.entity_key == "C002" for c in r.changes)
