import logging
from src import api_helpers


logger = logging.getLogger(__name__)


class Base(Exception):
    pass


class ArgumentError(Base):
    ''' Invalid arguments passed to request '''
    pass # pylint: disable=W0107


class NotFoundError(Base):
    ''' Invalid arguments passed to request '''
    pass # pylint: disable=W0107


def register_exception_handlers(flask_app):
    # catch exceptions thrown by us and propagate error message through
    @flask_app.errorhandler(Base)
    def handle_audius_error(error): # pylint: disable=W0612
        logger.exception("Audius-derived exception")
        return api_helpers.error_response(str(error), 400)

    # show a common error message for exceptions not thrown by us
    @flask_app.errorhandler(Exception)
    def handle_exception(_error): # pylint: disable=W0612
        logger.exception("Non Audius-derived exception")
        return api_helpers.error_response(["Something caused the server to crash."])

    @flask_app.errorhandler(404)
    def handle_404(_error): # pylint: disable=W0612
        return api_helpers.error_response(["Route does not exist"], 404)
