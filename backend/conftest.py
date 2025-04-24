import os
import pytest
import pymongo
from src.util.dao import DAO

TEST_DB = "edutask_test"

@pytest.fixture(scope="session", autouse=True)
def test_database(request):
    """
    Only point DAO at edutask_test and drop it if there's
    at least one @pytest.mark.integration test in the run.
    """
    # look through collected tests for the "integration" marker
    has_integration = any(
        item.get_closest_marker("integration") 
        for item in request.session.items
    )

    if not has_integration:
        # no integration tests ⇒ do nothing
        yield
        return

    # otherwise set up and tear down the test database
    mongo_url = f"mongodb://localhost:27017/{TEST_DB}"
    os.environ["MONGO_URL"] = mongo_url
    client = pymongo.MongoClient(mongo_url)
    client.drop_database(TEST_DB)
    yield
    client.drop_database(TEST_DB)

@pytest.fixture
def dao():
    """
    Factory fixture for getting DAOs; tracks each one and drops its
    collection after each test to keep everything isolated.
    """
    created = []

    def _get(collection_name: str):
        dao_obj = DAO(collection_name)
        created.append(dao_obj)
        return dao_obj

    yield _get

    # teardown: drop every collection we spun up
    for dao_obj in created:
        dao_obj.drop()
