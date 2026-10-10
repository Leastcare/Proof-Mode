from tests.fixtures.make_fixtures import make_before, make_after_clean, make_after_new_null
from app.rules.no_new_nulls import check_no_new_nulls


def test_no_new_nulls_pass():
    r = check_no_new_nulls(make_before(), make_after_clean(), "c6", "lbl", "email")
    assert r.passed
    assert r.new_nulls == 0


def test_no_new_nulls_fail():
    r = check_no_new_nulls(make_before(), make_after_new_null(), "c6", "lbl", "email")
    assert not r.passed
    assert r.new_nulls >= 1
