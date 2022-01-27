import psutil

# We first check '/var/k8s' in case the service operator has elected to
# mount an external volume for k8s data. Otherwise, default to the root path at '/'


def get_filesystem_size(**kwargs):
    """
    Gets the size of the entire filesystem (bytes)

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    disk = None
    try:
        disk = psutil.disk_usage("/var/k8s")
    except:
        disk = psutil.disk_usage("/")

    return disk.total


def get_filesystem_used(**kwargs):
    """
    Gets the used portion of the filesystem (bytes)

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    disk = None
    try:
        disk = psutil.disk_usage("/var/k8s")
    except:
        disk = psutil.disk_usage("/")

    return disk.used
