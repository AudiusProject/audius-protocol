import time

import psutil

# Global counters to keep track of last sent/recv value
bytes_sent = None
bytes_sent_time = None
bytes_recv = None
bytes_recv_time = None


def get_received_bytes_per_sec(**kwargs):
    """
    Gets the rate of received bytes per sec over the network

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    # pylint: disable=W0603
    global bytes_recv, bytes_recv_time

    net_io = psutil.net_io_counters()
    recv = net_io.bytes_recv
    t = time.time()

    rx_sec = 0
    if bytes_recv and bytes_recv_time:
        rx_sec = (recv - bytes_recv) / float(t - bytes_recv_time)

    bytes_recv = recv
    bytes_recv_time = t

    return rx_sec


def get_transferred_bytes_per_sec(**kwargs):
    """
    Gets the rate of transferred bytes per sec over the network

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    # pylint: disable=W0603
    global bytes_sent, bytes_sent_time

    net_io = psutil.net_io_counters()
    sent = net_io.bytes_sent
    t = time.time()

    tx_sec = 0
    if bytes_sent and bytes_sent_time:
        tx_sec = (sent - bytes_sent) / float(t - bytes_sent_time)

    bytes_sent = sent
    bytes_sent_time = t
    return tx_sec
