from tests.fixtures.make_fixtures import make_before, make_after_clean
from app.rules.row_count_range import check_row_count_range


def test_row_count_pass():
    # before=5 rows, after=4 rows → ratio = 0.8
    r = check_row_count_range(make_before(), make_after_clean(), "c8", "lbl",
                               min_ratio=0.75, max_ratio=1.0)
    assert r.passed


def test_row_count_fail_below():
    r = check_row_count_range(make_before(), make_after_clean(), "c8", "lbl",
                               min_ratio=0.95, max_ratio=1.0)
    assert not r.passed


def test_row_count_exact():
    r = check_row_count_range(make_after_clean(), make_after_clean(), "c8", "lbl",
                               min_ratio=1.0, max_ratio=1.0)
    assert r.passed
    assert r.actual_ratio == 1.0
