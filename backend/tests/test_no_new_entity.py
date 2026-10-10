from tests.fixtures.make_fixtures import make_before, make_after_clean, make_after_new_entity
from app.rules.no_new_entity import check_no_new_entity


def test_no_new_entity_pass():
    r = check_no_new_entity(make_before(), make_after_clean(), "c3", "lbl", "customer_id")
    assert r.passed
    assert r.new_count == 0


def test_no_new_entity_fail():
    r = check_no_new_entity(make_before(), make_after_new_entity(), "c3", "lbl", "customer_id")
    assert not r.passed
    assert "C999" in r.new_ids
