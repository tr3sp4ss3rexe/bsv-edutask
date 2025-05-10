import pytest
from unittest.mock import MagicMock
from src.controllers.usercontroller import UserController

# --------------------------------------------------------------------
# Fixtures
# --------------------------------------------------------------------
@pytest.fixture
def make_uc():
    """Return a factory that builds a UserController with a stub DAO."""
    def _factory(find_return=None, find_side_effect=None):
        dao = MagicMock()
        dao.find = MagicMock(return_value=find_return,
                             side_effect=find_side_effect)
        return UserController(dao)
    return _factory


# --------------------------------------------------------------------
# Successful look-ups
# --------------------------------------------------------------------
def test_get_user_one_match_returns_user(make_uc):
    uc = make_uc(find_return=[{"_id": 1, "email": "alice@example.com"}])
    assert uc.get_user_by_email("alice@example.com") == {"_id": 1, "email": "alice@example.com"}


def test_get_user_no_match_returns_none(make_uc):
    uc = make_uc(find_return=[])
    assert uc.get_user_by_email("ghost@example.com") is None


def test_get_user_multiple_matches_returns_first(make_uc):
    dao_return = [
        {"_id": 1, "email": "dup@example.com"},
        {"_id": 2, "email": "dup@example.com"},
    ]
    assert make_uc(find_return=dao_return).get_user_by_email("dup@example.com") == dao_return[0]


# --------------------------------------------------------------------
# Warnings & errors
# --------------------------------------------------------------------
def test_get_user_multiple_matches_logs_warning(make_uc, capsys):
    dao_return = [
        {"_id": 1, "email": "dup@example.com"},
        {"_id": 2, "email": "dup@example.com"},
    ]
    make_uc(find_return=dao_return).get_user_by_email("dup@example.com")
    assert "Error: more than one user found with mail dup@example.com" in capsys.readouterr().out


# ---- invalid e-mail formats ---------------------------------------------------
@pytest.mark.parametrize("bad_address", [
    "plainaddress",             # 0 × “@”
    "a@b@c@example.com",        # >1 × “@”
    "nodot@domain",             # no “.” after “@”
])
def test_get_user_invalid_email_raises_value_error(make_uc, bad_address):
    with pytest.raises(ValueError):
        make_uc(find_return=[]).get_user_by_email(bad_address)


# ---- DB failures --------------------------------------------------------------
def test_get_user_db_exception_is_propagated(make_uc):
    uc = make_uc(find_side_effect=Exception("DB fail"))
    with pytest.raises(Exception) as exc:
        uc.get_user_by_email("someone@example.com")
    assert "DB fail" in str(exc.value)
