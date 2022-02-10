import logging  # pylint: disable=C0302

from flask import Blueprint
from src import api_helpers

logger = logging.getLogger(__name__)
bp = Blueprint("notifications", __name__)


@bp.route("/load/task/<string:celery_task>", methods=("GET",))
def load_task(celery_task):

    return api_helpers.success_response(True)
