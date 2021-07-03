from flask import current_app
from src.challenges.profile_challenge import profile_challenge_manager

class ChallengeManagerRegistry:
    """Maintains a mapping of challenge_id => manager"""

    def __init__(self):
        self.managers = {}

    def register_manager(self, manager):
        """Registers a new manager"""
        self.managers[manager.challenge_id] = manager

    def get_manager(self, challenge_id):
        """Gets a manager for a given challenge_id"""
        return self.managers[challenge_id]

def setup_challenge_registry():
    """Registers managers and returns the registry"""
    registry = ChallengeManagerRegistry()
    registry.register_manager(profile_challenge_manager)
    return registry

def get_registry():
    """Gets the registry attached to the flask app object"""
    return current_app.challenge_registry
