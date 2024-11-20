import logging

from src.queries.get_feed_es import get_feed_es
from src.queries.query_helpers import get_pagination_vars

trackDedupeMaxMinutes = 10

logger = logging.getLogger(__name__)


def get_feed(args):
    try:
        (limit, offset) = get_pagination_vars()
        return get_feed_es(args, limit, offset)
    except Exception as e:
        logger.error(f"elasticsearch get_feed_es failed: {e}")
