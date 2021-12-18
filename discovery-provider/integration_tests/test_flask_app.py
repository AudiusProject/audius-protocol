import configparser
import os
from src import models
from src.utils.db_session import get_db
from src.utils.config import config_files
from .conftest import TEST_BROKER_URL, TEST_CONFIG_OVERRIDE


def test_creator_endpoint(app, client):
    """Ensure that the value returned from the exposed endpoint matches value in postgres"""
    return_value = client.get("/users")
    json_data = return_value.get_json()["data"]
    num_users_from_endpoint = len(json_data) if json_data is not None else 0
    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        query_results = session.query(models.User).order_by(models.User.user_id).all()
        num_query_results = len(query_results)
        assert num_users_from_endpoint == num_query_results


def test_config_values(app, client, celery_app, contracts):
    """Ensure that all config values are reflected in flask/celery applications"""
    config_from_file = configparser.ConfigParser()
    config_from_file.read(config_files)
    for section in config_from_file:
        if section == "DEFAULT":
            continue
        assert section in app.config
        for item in config_from_file.items(section):
            key = item[0]
            val = item[1]
            if app.config[section][key] != val:
                if TEST_CONFIG_OVERRIDE.get(section):
                    assert (
                        app.config[section][key] == TEST_CONFIG_OVERRIDE[section][key]
                    )
                    continue
                envvar = f"audius_{section}_{key}"
                if os.environ.get(envvar):
                    assert app.config[section][key] == os.environ.get(envvar)
                    continue

            assert app.config[section][key] == val

    if os.environ.get("audius_redis_url"):
        assert celery_app.celery.conf["broker_url"] == os.environ["audius_redis_url"]
    else:
        assert celery_app.celery.conf["broker_url"] == TEST_BROKER_URL
