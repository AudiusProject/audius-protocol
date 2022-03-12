import logging
from os import getenv, getpid

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


def process_identifier():
    return f"{getenv('audius_prometheus_container')}_{getpid()}"


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
