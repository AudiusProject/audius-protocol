import logging
from glob import glob
from os import getenv, getpid, remove

from flask import Blueprint, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    generate_latest,
    multiprocess,
    values,
)

logger = logging.getLogger(__name__)

bp = Blueprint("prometheus_metrics_exporter", __name__)

# hacky short-term solution since we only have two options: server/worker
# we cannot support another container type that's not explicitly setting
# $audius_prometheus_container
audius_prometheus_container = getenv("audius_prometheus_container", "worker")

# remove all *container*.db files since we're restarting the process
files = glob(f"/{getenv('PROMETHEUS_MULTIPROC_DIR')}/*{audius_prometheus_container}*")
for f in files:
    logger.info(f"Removing prometheus file: {f}")
    remove(f)


def process_identifier():
    return f"{audius_prometheus_container}_{getpid()}"


@bp.route("/prometheus_metrics", methods=["GET"])
def prometheus_metrics_exporter():
    values.ValueClass = values.MultiProcessValue(process_identifier=process_identifier)
    registry = CollectorRegistry()
    multiprocess.MultiProcessCollector(registry)
    data = generate_latest(registry)
    headers = {
        "Content-type": CONTENT_TYPE_LATEST,
        "Content-Length": str(len(data)),
    }
    return Response(data, headers=headers, mimetype=CONTENT_TYPE_LATEST)
