import csv
import json
import logging
import os
import tempfile
from itertools import islice

import requests

from src.tasks.celery_app import celery
from src.tasks.entity_manager.utils import save_cid_metadata
from src.utils import redis_connection
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

# Note, because the file is several GB
# Number of rows to insert at a time
chunk_size = 1_000


def backfill_cid_data(db: SessionManager):
    redis = redis_connection.get_redis()
    env = os.getenv("audius_discprov_env")
    if redis.get("backfilled_cid_data") or env not in ("stage", "prod"):
        return

    logger.info("backfill_cid_data.py | starting backfill")
    source_tsv_url = ""
    if env == "stage":
        source_tsv_url = "https://s3.us-west-1.amazonaws.com/download.staging.audius.co/stage-cid-metadata.tsv"
    elif env == "prod":
        source_tsv_url = "https://s3.us-west-1.amazonaws.com/download.audius.co/prod-cid-metadata.tsv"

    response = requests.get(source_tsv_url, stream=True)
    with tempfile.NamedTemporaryFile() as tmp:
        for block in response.iter_content(8192):
            tmp.write(block)
        tmp.flush()

        with db.scoped_session() as session:
            # Load cid data from csv in chunks...
            with open(tmp.name, "r") as file:
                # Set 370KB limit for csv fields
                csv.field_size_limit(370_000)
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
    redis.set("backfilled_cid_data", "true")


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
