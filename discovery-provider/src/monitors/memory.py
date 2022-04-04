import psutil


def get_total_memory(**kwargs):
    """
    Gets the total vitual memory of the system

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    mem = psutil.virtual_memory()
    return mem.total


def get_used_memory(**kwargs):
    """
    Gets the used virtual memory of the system

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    mem = psutil.virtual_memory()
    return mem.used
