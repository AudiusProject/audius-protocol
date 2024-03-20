import asyncio
from datetime import timedelta

from src.async_utils import async_interval
from src.database_task import DatabaseTask
from src.tasks.cache_current_nodes import cache_current_nodes_task


async def async_main(ctx: DatabaseTask):
    tasks = []

    # cache current nodes task
    cache_current_nodes_interval = timedelta(seconds=10)
    tasks.append(
        async_interval(cache_current_nodes_interval, cache_current_nodes_task, ctx)
    )

    await asyncio.gather(*tasks)
