import asyncio
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)


async def async_interval(interval: timedelta, task, *args, **kwargs):
    """
    Runs async tasks at the specified interval.
    Should the task take shorter than the allotted time a delta will be calculated and the task will yield until the time is hit.
    Should the task take longer than the allotted time it will simply be called again.
    """
    task_name = task.__name__
    logger.info(f"{task_name} | beginning interval")
    try:
        while True:
            start_time = asyncio.get_running_loop().time()
            await task(*args, **kwargs)
            end_time = asyncio.get_running_loop().time()
            elapsed = end_time - start_time
            delay = interval.total_seconds() - elapsed
            if delay > 0:
                await asyncio.sleep(delay)
    except Exception as e:
        logger.error(f"{task_name} | fatal error in async task {e}", exc_info=True)
        raise e
