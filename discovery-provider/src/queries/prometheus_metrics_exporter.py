import logging

from flask import Blueprint, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    generate_latest,
    multiprocess,
)

logger = logging.getLogger(__name__)

bp = Blueprint("prometheus_metrics_exporter", __name__)


@bp.route("/prometheus_metrics", methods=["GET"])
def prometheus_metrics_exporter():
    registry = CollectorRegistry()
    multiprocess.MultiProcessCollector(registry)
    data = generate_latest(registry)
    headers = {
        "Content-type": CONTENT_TYPE_LATEST,
        "Content-Length": str(len(data)),
    }
    return Response(data, headers=headers, mimetype=CONTENT_TYPE_LATEST)
