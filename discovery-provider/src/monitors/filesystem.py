import psutil


def get_filesystem_size(**kwargs):
    """
    Gets the size of the entire filesystem (bytes)

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    disk = psutil.disk_usage("/")
    return disk.total


def get_filesystem_used(**kwargs):
    """
    Gets the used portion of the filesystem (bytes)

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    disk = psutil.disk_usage("/")
    return disk.used
