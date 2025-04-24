import pytest
import datetime
from pymongo.errors import WriteError
from bson import ObjectId
pytestmark = pytest.mark.integration

# ---------- task tests ----------

def test_task_create_minimal(dao):
    d = dao("task")
    payload = {"title": "T1", "description": "D1"}
    result = d.create(payload)
    assert result["title"] == "T1"
    assert result["description"] == "D1"
    assert "_id" in result

@pytest.mark.parametrize("payload", [
    ({"description": "D1"}),                   # missing title
    ({"title": 123, "description": "D"}),       # wrong type for title
])
def test_task_invalid_required_or_type(dao, payload):
    with pytest.raises(WriteError):
        dao("task").create(payload)

def test_task_optional_date_ok(dao):
    now = datetime.datetime.utcnow()
    result = dao("task").create({
        "title": "T2",
        "description": "D2",
        "startdate": now
    })
    assert "$date" in result["startdate"]

def test_task_optional_date_invalid(dao):
    with pytest.raises(WriteError):
        dao("task").create({
            "title": "T3",
            "description": "D3",
            "startdate": "not-a-date"
        })

def test_task_unique_duplicate_allowed(dao):
    # duplicates allowed since uniqueItems not enforced as unique index
    d = dao("task")
    payload = {"title": "T4", "description": "D4"}
    first = d.create(payload)
    second = d.create(payload)
    assert first["_id"] != second["_id"]

# ---------- user tests ----------

def test_user_create_minimal(dao):
    d = dao("user")
    payload = {"firstName": "F1", "lastName": "L1", "email": "e1@example.com"}
    result = d.create(payload)
    assert result["firstName"] == "F1"
    assert result["lastName"] == "L1"
    assert result["email"] == "e1@example.com"
    assert "_id" in result

@pytest.mark.parametrize("payload", [
    ({"firstName": "F2", "email": "e2@example.com"}),    # missing lastName
    ({"firstName": "F3", "lastName": "L3", "email": 123}),# wrong type for email
])
def test_user_invalid_required_or_type(dao, payload):
    with pytest.raises(WriteError):
        dao("user").create(payload)

def test_user_optional_tasks_ok(dao):
    oid = ObjectId()
    d = dao("user")
    result = d.create({
        "firstName": "F4",
        "lastName": "L4",
        "email": "e4@example.com",
        "tasks": [oid]
    })
    assert isinstance(result["tasks"][0], dict) and "$oid" in result["tasks"][0]

def test_user_optional_tasks_invalid(dao):
    with pytest.raises(WriteError):
        dao("user").create({
            "firstName": "F5",
            "lastName": "L5",
            "email": "e5@example.com",
            "tasks": ["not-an-oid"]
        })

def test_user_unique_duplicate_allowed(dao):
    # duplicates allowed since no unique index on email
    d = dao("user")
    payload = {"firstName": "F6", "lastName": "L6", "email": "e6@example.com"}
    first = d.create(payload)
    second = d.create(payload)
    assert first["_id"] != second["_id"]

# ---------- todo tests ----------

def test_todo_create_minimal(dao):
    d = dao("todo")
    payload = {"description": "Do X"}
    result = d.create(payload)
    assert result["description"] == "Do X"
    assert "_id" in result

@pytest.mark.parametrize("payload", [
    ({}),                       # missing description
    ({"description": False}),   # wrong type for description
])
def test_todo_invalid_required_or_type(dao, payload):
    with pytest.raises(WriteError):
        dao("todo").create(payload)

def test_todo_optional_done_ok(dao):
    d = dao("todo")
    result = d.create({"description": "Do Y", "done": True})
    assert result["done"] is True

def test_todo_unique_duplicate_allowed(dao):
    # duplicates allowed since uniqueItems only applies to arrays
    d = dao("todo")
    payload = {"description": "Do Z"}
    first = d.create(payload)
    second = d.create(payload)
    assert first["_id"] != second["_id"]

# ---------- video tests ----------

def test_video_create_minimal(dao):
    d = dao("video")
    payload = {"url": "http://video"}
    result = d.create(payload)
    assert result["url"] == "http://video"
    assert "_id" in result

@pytest.mark.parametrize("payload", [
    ({}),              # missing url
    ({"url": 123}),    # wrong type for url
])
def test_video_invalid_required_or_type(dao, payload):
    with pytest.raises(WriteError):
        dao("video").create(payload)

def test_video_duplicate_allowed(dao):
    payload = {"url": "http://video2"}
    d = dao("video")
    first = d.create(payload)
    second = d.create(payload)
    assert first["url"] == second["url"] == "http://video2"
