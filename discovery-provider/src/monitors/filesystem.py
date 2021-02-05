import psutil


def get_filesystem_size(**kwargs):
    disk = psutil.disk_usage('/')
    return disk.total


def get_filesystem_used(**kwargs):
    disk = psutil.disk_usage('/')
    return disk.used
