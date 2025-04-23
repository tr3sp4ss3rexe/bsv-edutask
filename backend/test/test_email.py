# tests/test_usercontroller.py
import pytest
from unittest.mock import MagicMock
from src.controllers.usercontroller import UserController


def make_uc(find_return=None, find_side_effect=None):
    """Utility to create a UserController with a mocked DAO."""
    dao = MagicMock()
    dao.find = MagicMock(return_value=find_return, side_effect=find_side_effect)
    return UserController(dao)


@pytest.mark.parametrize(
    "email, dao_return, expected",
    [
        # exactly one user
        ("alice@example.com", [{"_id": 1, "email": "alice@example.com"}], {"_id": 1, "email": "alice@example.com"}),
        # no user
        ("ghost@example.com", [], None),
    ],
)
def test_get_user_normal_paths(email, dao_return, expected):
    uc = make_uc(find_return=dao_return)
    assert uc.get_user_by_email(email) == expected


def test_get_user_multiple_matches_warning(capsys):
    dao_return = [
        {"_id": 1, "email": "dup@example.com"},
        {"_id": 2, "email": "dup@example.com"},
    ]
    uc = make_uc(find_return=dao_return)

    result = uc.get_user_by_email("dup@example.com")
    captured = capsys.readouterr()

    assert result == dao_return[0]
    assert "Error: more than one user found with mail dup@example.com" in captured.out


def test_get_user_invalid_email():
    uc = make_uc(find_return=[])
    with pytest.raises(ValueError):
        uc.get_user_by_email("not-an-email")


def test_get_user_db_failure_propagates():
    uc = make_uc(find_side_effect=Exception("DB fail"))
    with pytest.raises(Exception) as exc:
        uc.get_user_by_email("bob@example.com")
    assert "DB fail" in str(exc.value)
