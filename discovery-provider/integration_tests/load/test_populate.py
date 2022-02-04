import logging
import unittest
from collections import defaultdict
from os import getenv
from pprint import pprint
from random import randrange
from time import time
from typing import List

from integration_tests.utils import populate_mock_db
from src import models
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

redis = get_redis()

logger = logging.getLogger(__name__)


def debug(db):
    with db.scoped_session() as session:
        results: List[models.User] = (
            session.query(models.User).order_by(models.User.user_id).all()
        )
        pprint(results)

        results: List[models.Track] = (
            session.query(models.Track).order_by(models.Track.track_id).all()
        )
        pprint(results)

        results: List[models.Play] = (
            session.query(models.Play).order_by(models.Play.id).all()
        )
        pprint(results)

        results: List[models.Follow] = (
            session.query(models.Follow).order_by(models.Follow.follower_user_id).all()
        )
        pprint(results)

        results: List[models.Repost] = (
            session.query(models.Repost).order_by(models.Repost.user_id).all()
        )
        pprint(results)

        results: List[models.Save] = (
            session.query(models.Save).order_by(models.Save.user_id).all()
        )
        pprint(results)


class Metrics:
    """Sample interface, before adding Grafana"""

    def __init__(self):
        self.metrics = defaultdict(dict)

    def save(self, metric, timestamp, elapsed_time):
        self.metrics[metric][timestamp] = elapsed_time

    def print(self):
        pprint(self.metrics)


class Population:
    def __init__(self, pop_increments, pop_index=None):
        self.pop_increments = pop_increments
        self.pop_index = pop_index if pop_index else defaultdict(int)
        self.unique_pairs = set()
        self.metrics = Metrics()

    def __generate_unique_set(self, additional_keys):
        """Recursive helper to ensure unique matches"""

        # populate new_pair with something like p.random("users")
        new_pair = {}
        for key, func_, args in additional_keys:
            new_pair[key] = func_(*args)

        # if we get a collision, try again
        if str(new_pair) in self.unique_pairs:
            return self.__generate_unique_set(additional_keys)

        # prevent future collisions
        self.unique_pairs.add(str(new_pair))

        return new_pair

    def random(self, entity):
        """Choose a random entity id based on previously and currently created entities"""

        return randrange(self.pop_index[entity] + self.pop_increments[entity])

    def bump_population_indexes(self):
        """Update current population counts"""

        for k, _ in self.pop_increments.items():
            self.pop_index[k] += self.pop_increments[k]

    def create_population(self, entity, key=None, additional_keys=None):
        """Main helper to create entity dicts"""

        # create empty shells
        population = [{} for i in range(self.pop_increments[entity])]

        # add main primary key, if present
        if key:
            for i, p in enumerate(population):
                p.update({key: self.pop_index[entity] + i})

        # return early for simple entities
        if not additional_keys:
            return population

        # add additional keys for complex entities
        for p in population:
            p.update(self.__generate_unique_set(additional_keys))

        return population

    def apply(self, db, entities):
        """Time, populate db, and bump populations"""

        start_time = time()
        populate_mock_db(db, entities)
        self.metrics.save("apply", time(), time() - start_time)
        self.bump_population_indexes()
        self.metrics.save("counts", time(), dict(self.pop_index))


@unittest.skipIf(int(getenv("LOAD_TEST", 0)) < 1, "Manual load test")
def test_populate(app):
    """Add entities required for Trending in multiple iterations"""

    with app.app_context():
        db = get_db()

    # define how many entities are added per iteration
    iterations = 10
    pop_increments = {
        "users": 10,
        "tracks": 10,
        "plays": 10,
        "follows": 10,
        "reposts": 10,
        "saves": 10,
    }
    p = Population(pop_increments)

    for _ in range(iterations):
        entities = {
            "users": p.create_population("users", "user_id"),
            "tracks": p.create_population("tracks", "track_id"),
            "plays": p.create_population(
                "plays",
                "id",
                [
                    ("user_id", p.random, ("users",)),
                ],
            ),
            "follows": p.create_population(
                "follows",
                None,
                [
                    ("follower_user_id", p.random, ("users",)),
                    ("followee_user_id", p.random, ("users",)),
                ],
            ),
            "reposts": p.create_population(
                "reposts",
                None,
                [
                    ("user_id", p.random, ("users",)),
                    ("repost_item_id", p.random, ("tracks",)),
                ],
            ),
            "saves": p.create_population(
                "saves",
                None,
                [
                    ("user_id", p.random, ("users",)),
                    ("save_item_id", p.random, ("tracks",)),
                ],
            ),
        }
        p.apply(db, entities)

        # TODO: run sync queries (save metrics within)

    # debug(db)
    p.metrics.print()
