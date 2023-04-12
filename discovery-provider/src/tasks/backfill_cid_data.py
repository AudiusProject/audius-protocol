import csv
import json
import logging
import tempfile
import os
from itertools import islice

import requests
from src.tasks.celery_app import celery
from src.tasks.index import save_cid_metadata
from src.utils.config import shared_config
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

# Note, because the file is several GB
# Number of rows to insert at a time
chunk_size = 1_000


def backfill_cid_data(db: SessionManager):
    logger.info("backfill_cid_data.py | starting backfill")
    source_tsv_url = ""
    env = os.getenv("audius_discprov_env")
    if env == "stage" and "stage_backfill_cid_data_url" in shared_config["discprov"]:
        source_tsv_url = shared_config["discprov"]["stage_backfill_cid_data_url"]
    elif env == "prod" and "prod_backfill_cid_data_url" in shared_config["discprov"]:
        source_tsv_url = shared_config["discprov"]["prod_backfill_cid_data_url"]

    response = requests.get(source_tsv_url, stream=True)
    with tempfile.NamedTemporaryFile() as tmp:
        for block in response.iter_content(8192):
            tmp.write(block)
        tmp.flush()

        with db.scoped_session() as session:
            # Load cid data from csv in chunks...
            with open(tmp.name, "r") as file:
                while True:
                    csv_reader = csv.reader(file, delimiter="\t")
                    lines = list(islice(csv_reader, chunk_size))
                    cid_metadata = {}
                    cid_type = {}
                    if not lines:
                        break
                    for line in lines:
                        if len(line) != 3:
                            continue
                        [cid, type, data] = line
                        cid_metadata[cid] = json.loads(data)
                        cid_type[cid] = type
                    # Write chunk to db
                    save_cid_metadata(session, cid_metadata, cid_type)
    logger.info("backfill_cid_data.py | finished backfill")


# ####### CELERY TASKS ####### #
@celery.task(name="backfill_cid_data", bind=True)
@save_duration_metric(metric_group="celery_task")
def backfill_cid_data_task(self):
    """Backfills the CID JSON Data for users, tracks, and playlists from a env csv"""
    db = backfill_cid_data_task.db
    redis = backfill_cid_data_task.redis
    have_lock = False
    update_lock = redis.lock("backfill_cid_data_lock", timeout=86400)
    try:
        backfill_cid_data(db)
    except Exception as e:
        logger.error("backfill_cid_data.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
