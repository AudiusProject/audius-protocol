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
    existing_challenges = session.query(Challenge).all()
    existing_ids = {c.id for c in existing_challenges}

    # filter to only new challenges
    new_challenges = list(filter(lambda c: c.get('id') not in existing_ids, challenges_dicts))
    logger.info(f"Adding challenges: {challenges_dicts}")

    # Add all the new challenges
    for challenge_dict in new_challenges:
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

    # Update any challenges whose active state / amount changed
    existing_challenge_map = {challenge.id: challenge for challenge in existing_challenges}
    for challenge_dict in challenges_dicts:
        existing = existing_challenge_map[challenge_dict["id"]]
        existing.active = challenge_dict["active"]
        existing.amount = challenge_dict["amount"]

