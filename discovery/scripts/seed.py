import argparse
import csv
import random
import time
from datetime import datetime
from io import StringIO
from typing import Dict, List

import pandas as pd
from sqlalchemy import create_engine, text

# inspired in part by https://towardsdatascience.com/generating-random-data-into-a-database-using-python-fd2f7d54024e


class Seeder:
    def __init__(self):
        self.con = create_engine(
            "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/audius_discovery",
            echo=False,
        )
        self.user_ids = []
        self.blocknumbers = []

    def seed(self, tablename: str, rows: List[Dict]):
        df = pd.DataFrame(rows)
        print(f"{tablename}: Seeding {len(df)} rows...")
        df.to_sql(
            tablename,
            con=self.con,
            index=False,
            if_exists="append",
            method=self.psql_insert_copy,
        )
        print(f"{tablename}: Seeded")

    @staticmethod
    # Taken from https://pandas.pydata.org/pandas-docs/stable/user_guide/io.html#io-sql-method
    def psql_insert_copy(table, conn, keys, data_iter):
        """
        Execute SQL statement inserting data

        Parameters
        ----------
        table : pandas.io.sql.SQLTable
        conn : sqlalchemy.engine.Engine or sqlalchemy.engine.Connection
        keys : list of str
            Column names
        data_iter : Iterable that iterates the values to be inserted
        """
        # gets a DBAPI connection that can provide a cursor
        dbapi_conn = conn.connection
        with dbapi_conn.cursor() as cur:
            s_buf = StringIO()
            writer = csv.writer(s_buf)
            writer.writerows(data_iter)
            s_buf.seek(0)

            columns = ", ".join(['"{}"'.format(k) for k in keys])
            if table.schema:
                table_name = "{}.{}".format(table.schema, table.name)
            else:
                table_name = table.name

            sql = "COPY {} ({}) FROM STDIN WITH CSV".format(table_name, columns)
            cur.copy_expert(sql=sql, file=s_buf)

    def seed_blocks(self, count, blocknumber_offset=0):
        print(f"blocks: Generating {count}...")
        blocks = []
        for i in range(count):
            blocks.append(FakeGenerator.generate_block(blocknumber_offset + i))
        self.seed("blocks", blocks)
        self.blocknumbers = [block["number"] for block in blocks]

    def seed_users(self, count, user_id_offset=0):
        print(f"users: Generating {count}...")
        users = []
        for i in range(count):
            [blocknumber] = random.sample(self.blocknumbers, 1)
            users.append(
                FakeGenerator.generate_user(i + user_id_offset, blocknumber=blocknumber)
            )
        self.seed("users", users)
        self.user_ids = [user["user_id"] for user in users]
        return users

    def seed_aggregate_user_tips(self, count):
        print(f"aggregate_user_tips: Generating {count}...")
        aggregate_user_tips = []
        picked_user_ids = set()
        while len(picked_user_ids) < count:
            picked_user_ids.add(tuple(random.sample(self.user_ids, 2)))
        for sender_user_id, receiver_user_id in picked_user_ids:
            aggregate_user_tips.append(
                FakeGenerator.generate_aggregate_user_tip(
                    sender_user_id=sender_user_id,
                    receiver_user_id=receiver_user_id,
                )
            )
        self.seed("aggregate_user_tips", aggregate_user_tips)

    def seed_follows(self, count):
        print(f"follows: Generating {count}...")
        follows = []
        picked_user_ids = set()
        while len(picked_user_ids) < count:
            picked_user_ids.add(tuple(random.sample(self.user_ids, 2)))
        for follower_user_id, followee_user_id in picked_user_ids:
            follows.append(
                FakeGenerator.generate_follow(
                    follower_user_id=follower_user_id, followee_user_id=followee_user_id
                )
            )
        self.seed("follows", follows)

    def seed_user_tips(self, count, slot_offset=0):
        print(f"user_tips: Generating {count}...")
        user_tips = []
        slot = slot_offset
        for _ in range(count):
            sender_user_id, receiver_user_id = random.sample(self.user_ids, 2)
            user_tips.append(
                FakeGenerator.generate_user_tip(
                    sender_user_id=sender_user_id,
                    receiver_user_id=receiver_user_id,
                    slot=slot,
                )
            )
            slot += random.randrange(0, 15)
        self.seed("user_tips", user_tips)

    def clear_seeds(self, user_id_offset, blocknumber_offset):
        print(
            f"Clearing data for users >= {user_id_offset}, clearing blocks >= {blocknumber_offset}..."
        )
        self.con.execute(
            text(
                """
                BEGIN;
                DELETE FROM users WHERE user_id >= :user_id_offset;
                DELETE FROM blocks WHERE number >= :blocknumber_offset;
                DELETE FROM follows WHERE follower_user_id >= :user_id_offset OR followee_user_id >= :user_id_offset;
                DELETE FROM aggregate_user_tips WHERE sender_user_id >= :user_id_offset OR receiver_user_id >= :user_id_offset;
                DELETE FROM user_tips WHERE sender_user_id >= :user_id_offset OR receiver_user_id >= :user_id_offset;
                COMMIT;
                """
            ),
            {
                "user_id_offset": user_id_offset,
                "blocknumber_offset": blocknumber_offset,
            },
        )
        print("Cleared.")


class FakeGenerator:
    @staticmethod
    def generate_aggregate_user_tip(sender_user_id, receiver_user_id):
        return {
            "sender_user_id": sender_user_id,
            "receiver_user_id": receiver_user_id,
            "amount": random.randrange(1, 1000),
        }

    @staticmethod
    def generate_user_tip(sender_user_id, receiver_user_id, slot):
        return {
            "sender_user_id": sender_user_id,
            "receiver_user_id": receiver_user_id,
            "amount": random.randrange(1, 1000),
            "slot": slot,
            "signature": f"fake-signature-tips-{sender_user_id}-{receiver_user_id}-{slot}",
            "created_at": datetime.now(),
        }

    @staticmethod
    def generate_user(user_id, blocknumber):
        return {
            "user_id": user_id,
            "txhash": f"fake-tx-user-{user_id}",
            "is_current": True,
            "handle": f"fake_user_{user_id}",
            "wallet": f"fake-user-wallet-{user_id}",
            "is_verified": random.randrange(0, 5) == 1,
            "name": f"Fake User {user_id}",
            "updated_at": datetime.now(),
            "created_at": datetime.now(),
            "blocknumber": blocknumber,
            "blockhash": f"fake-blockhash-{blocknumber}",
        }

    @staticmethod
    def generate_follow(follower_user_id, followee_user_id):
        return {
            "follower_user_id": follower_user_id,
            "followee_user_id": followee_user_id,
            "is_current": True,
            "is_delete": False,
            "created_at": datetime.now(),
            "txhash": f"fake-txhash-follow-{follower_user_id}-{followee_user_id}",
        }

    @staticmethod
    def generate_block(blocknumber):
        return {
            "blockhash": f"fake-blockhash-{blocknumber}",
            "parenthash": f"fake-blockhash-{blocknumber-1}",
            "is_current": False,
            "number": blocknumber,
        }


parser = argparse.ArgumentParser(description="Seed database with fake data.")
parser.add_argument("--num-users", default=100_000, help="Number of users to seed")
parser.add_argument(
    "--user-id-offset", default=100_000, help="Offset to use for the user IDs"
)
parser.add_argument(
    "--slot-offset", default=1_000_000, help="Offset to use for the slots"
)
parser.add_argument(
    "--blocknumber-offset",
    default=1_000_000,
    help="Offset to use for the block numbers",
)
parser.add_argument("--num-blocks", default=1_000, help="Number of blocks to seed")
parser.add_argument(
    "--num-user-tips", default=2_000_000, help="Number of user_tips to seed"
)
parser.add_argument(
    "--num-aggregate-user-tips",
    default=0,
    help="Number of aggregate_user_tips to seed",
)
parser.add_argument(
    "--num-follows", default=2_000_000, help="Number of follows to seed"
)
parser.add_argument(
    "--clear-existing",
    default=False,
    help="Clear any data that might get in the way of seeded data's primary keys etc (useful for rerunning the seed commands)",
)


args = parser.parse_args()


seeder = Seeder()
if args.clear_existing:
    seeder.clear_seeds(
        user_id_offset=args.user_id_offset, blocknumber_offset=args.blocknumber_offset
    )
else:
    start = time.time()
    seeder.seed_blocks(args.num_blocks, blocknumber_offset=args.blocknumber_offset)
    seeder.seed_users(
        args.num_users,
        user_id_offset=args.user_id_offset,
    )
    seeder.seed_follows(args.num_follows)
    seeder.seed_user_tips(args.num_user_tips, slot_offset=args.slot_offset)
    seeder.seed_aggregate_user_tips(args.num_aggregate_user_tips)
    print(f"Seeder finished in {time.time() - start}")
