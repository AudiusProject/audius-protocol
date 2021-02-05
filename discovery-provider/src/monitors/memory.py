import psutil


def get_total_memory(**kwargs):
    mem = psutil.virtual_memory()
    return mem.total


def get_used_memory(**kwargs):
    mem = psutil.virtual_memory()
    return mem.used
