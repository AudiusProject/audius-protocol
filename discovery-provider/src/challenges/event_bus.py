class EventBus:
    """Interface for dispatching events"""

    def dispatch(self):
        raise NotImplementedError()
