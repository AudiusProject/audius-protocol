# https://stackoverflow.com/questions/31299709/alembic-create-table-check-if-table-exists
from pathlib import Path

import sqlalchemy
from alembic import op
from sqlalchemy import engine_from_config
from sqlalchemy.engine import reflection


def table_exists(table_name):
    config = op.get_context().config
    engine = engine_from_config(
        config.get_section(config.config_ini_section), prefix="sqlalchemy."
    )
    inspector = reflection.Inspector.from_engine(engine)
    tables = inspector.get_table_names()
    return table_name in tables


def _load_sql_file(name):
    path = Path(__file__).parent.joinpath(f"../../alembic/trigger_sql/{name}")
    with open(path) as f:
        return f.read()


def build_sql(file_names):
    files = [_load_sql_file(f) for f in file_names]
    inner_sql = "\n;\n".join(files)
    return sqlalchemy.text("begin; \n\n " + inner_sql + " \n\n commit;")
