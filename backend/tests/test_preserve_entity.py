from tests.fixtures.make_fixtures import make_before, make_after_clean, make_after_missing_entity
from app.rules.preserve_entity import check_preserve_entity


def test_preserve_entity_pass():
    r = check_preserve_entity(make_before(), make_after_clean(), "c1", "lbl", "customer_id",
                               legitimately_removed={"C003"})
    assert r.passed
    assert r.missing_count == 0


def test_preserve_entity_fail():
    r = check_preserve_entity(make_before(), make_after_missing_entity(), "c1", "lbl", "customer_id")
    assert not r.passed
    assert "C004" in r.unexplained_ids


def test_preserve_entity_dupe_credit():
    """C003 duplicate is legitimately removed — should not count as unexplained."""
    r = check_preserve_entity(make_before(), make_after_missing_entity(), "c1", "lbl",
                               "customer_id", legitimately_removed={"C003"})
    assert not r.passed          # C004 still missing
    assert "C003" not in r.unexplained_ids
