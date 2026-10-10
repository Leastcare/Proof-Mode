from tests.fixtures.make_fixtures import make_before, make_after_clean, make_after_missing_entity
from app.services.reconciliation import build_reconciliation


def test_reconciliation_balanced():
    r = build_reconciliation(make_before(), make_after_clean(),
                             "customer_id", duplicate_ids={"C003"})
    assert r.is_balanced
    assert r.counts["UNEXPLAINED_LOSS"] == 0
    # C003 survived (one copy kept), so it's in SURVIVED not LEGITIMATELY_REMOVED
    assert r.counts["SURVIVED"] == 4
    assert r.counts["LEGITIMATELY_REMOVED_DUPLICATE"] == 0


def test_reconciliation_unexplained_loss():
    r = build_reconciliation(make_before(), make_after_missing_entity(),
                             "customer_id", duplicate_ids={"C003"})
    assert r.counts["UNEXPLAINED_LOSS"] == 1
    assert "C004" in r.unexplained_ids


def test_reconciliation_totals_consistent():
    r = build_reconciliation(make_before(), make_after_clean(), "customer_id")
    total = sum(r.counts.values())
    # survived + lost + new = unique before IDs + new entities
    assert r.counts["SURVIVED"] + r.counts["UNEXPLAINED_LOSS"] + r.counts["LEGITIMATELY_REMOVED_DUPLICATE"] == 4
