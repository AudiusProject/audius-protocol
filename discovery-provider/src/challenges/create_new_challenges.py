import json
import logging
from src.models import Challenge
from os import path
import pathlib

logger = logging.getLogger(__name__)

def get_challenges_dicts():
    challenges_path = path.join(pathlib.Path(__file__).parent, 'challenges.json')
    with open(challenges_path) as f:
        raw = f.read()
        parsed = json.loads(raw)
        return parsed

def create_new_challenges(session):
    challenges_dicts = get_challenges_dicts()
    challenges = []
    existing_ids = {c.id for c in session.query(Challenge).all()}

    # filter to only new challenges
    challenges_dicts = list(filter(lambda c: c.get('id') not in existing_ids, challenges_dicts))
    logger.info(f"Adding challenges: {challenges_dicts}")

    for challenge_dict in challenges_dicts:
        challenge = Challenge(
            id=challenge_dict.get('id'),
            type=challenge_dict.get('type'),
            amount=challenge_dict.get('amount'),
            active=challenge_dict.get('active'),
            starting_block=challenge_dict.get('starting_block'),
            step_count=challenge_dict.get('step_count')
        )
        challenges.append(challenge)
    session.add_all(challenges)
