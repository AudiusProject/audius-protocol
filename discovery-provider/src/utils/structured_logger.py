import time
from logging import Logger
from typing import Dict, List


class StructuredLogger:
    def __init__(self, logger: Logger):
        self.logger = logger
        self.context: Dict = {}

    def set_context(self, key: str, value):
        self.context[key] = value

    def get_context(self):
        return {
            "job": self.logger.name,
            **self.context,
        }

    def reset_context(self):
        self.context = {}

    def info(self, message, *args, **kwargs):
        kwargs["extra"] = self.get_context()  # Set the updated extra context
        self.logger.info(message, *args, **kwargs)  # Call the original logger.info method

    def error(self, message, *args, **kwargs):
        kwargs["extra"] = self.get_context()  # Set the updated extra context
        self.logger.error(message, *args, **kwargs)  # Call the original logger.info method

    def debug(self, message, *args, **kwargs):
        kwargs["extra"] = self.get_context()  # Set the updated extra context
        self.logger.debug(message, *args, **kwargs)  # Call the original logger.info method

    def warn(self, message, *args, **kwargs):
        kwargs["extra"] = self.get_context()  # Set the updated extra context
        self.logger.warn(message, *args, **kwargs)  # Call the original logger.info method


def log_duration(logger: StructuredLogger):
    """
    Decorator to log the duration of function execution.
    Accepts a logger as an argument for logging.
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            duration = end_time - start_time
            logger.info(f"asdf {func.__name__} in {duration}")
            return result
        return wrapper
    return decorator
