import logging
from typing import Any

from sqlalchemy.ext.declarative import declarative_base

Base: Any = declarative_base()
logger = logging.getLogger(__name__)
