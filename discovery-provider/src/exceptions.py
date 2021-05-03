class Base(Exception):
    pass


class ArgumentError(Base):
    ''' Invalid arguments passed to request '''
    pass # pylint: disable=W0107


class NotFoundError(Base):
    ''' Invalid arguments passed to request '''
    pass # pylint: disable=W0107
