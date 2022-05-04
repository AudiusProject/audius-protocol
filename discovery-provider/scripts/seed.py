import argparse
import csv
import random
from collections import defaultdict
from io import StringIO

import pandas as pd
from sqlalchemy import create_engine


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


# inspired in part by https://towardsdatascience.com/generating-random-data-into-a-database-using-python-fd2f7d54024e
def seed_aggregate_tips(args):
    aggregate_user_tips = defaultdict(list)
    current_receiver_id = args.offset
    for _ in range(args.n):
        current_receiver_id += random.randrange(1, 5)
        current_sender_id = args.offset
        tip_count = random.randrange(args.min_tips, args.max_tips)
        for _ in range(tip_count):
            current_sender_id += random.randrange(1, 5)
            aggregate_user_tips["sender_user_id"].append(current_sender_id)
            aggregate_user_tips["receiver_user_id"].append(current_receiver_id)
            aggregate_user_tips["amount"].append(random.randrange(1, 1000))

    df = pd.DataFrame(aggregate_user_tips)
    print(f"Generated {len(df)} rows...")
    con = create_engine(
        "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/audius_discovery",
        echo=False,
    )
    rows = df.to_sql(
        "aggregate_user_tips",
        con=con,
        index=False,
        if_exists="append",
        method=psql_insert_copy,
    )
    print(f"Created {rows} rows")


parser = argparse.ArgumentParser(description="Seed database with fake data.")
subparsers = parser.add_subparsers(title="commands")


subparser_seed_aggregate_tips = subparsers.add_parser(
    "aggregate_tips", help="Seed aggregate_tips table with a large amount of data"
)
subparser_seed_aggregate_tips.add_argument(
    "--min_tips", default=100, help="the min amount of tips each receiver should have"
)
subparser_seed_aggregate_tips.add_argument(
    "--max_tips", default=1000, help="the max amount of tips each receiver should have"
)
subparser_seed_aggregate_tips.add_argument(
    "-n", default=5000, help="the number of users to send tips to"
)
subparser_seed_aggregate_tips.add_argument(
    "--offset",
    default=1000,
    help="the user id offset (useful if you want to purge fake data)",
)
subparser_seed_aggregate_tips.set_defaults(func=seed_aggregate_tips)

args = parser.parse_args()
args.func(args)
