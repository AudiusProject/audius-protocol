#!/bin/bash
#
# PostgreSQL schema migration manager
# https://github.com/zenwalker/pg_migrate.sh/tree/v2.0

set -e
[[ -f .env ]] && source .env

MIGRATIONS_TABLE="schema_version"

POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_HOST=${POSTGRES_HOST:-127.0.0.1}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
export PGPASSWORD="$POSTGRES_PASSWORD"

is_test=$1

# setting DB_URL will override any individual settings from above
DB_URL=${DB_URL:-postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB}

# remove +psycopg2 from DB_URL
DB_URL="${DB_URL/\+psycopg2/}"

alias psql='psql -qtAX -v ON_ERROR_STOP=1 $DB_URL'
shopt -s expand_aliases


create_migrations_table() {
    migrations_table_exists=$(psql -c "SELECT to_regclass('$MIGRATIONS_TABLE');")

    if  [[ ! $migrations_table_exists ]]; then
        echo "Creating $MIGRATIONS_TABLE table"
        psql -c "CREATE TABLE $MIGRATIONS_TABLE (file_name text PRIMARY KEY, md5 text, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());"
    fi
}


migrate_dir() {
    migration_files=$(ls "$1"/*.sql | sort -V)

    md5s=$(psql -c "select md5 from $MIGRATIONS_TABLE")

    for file in $migration_files; do
        md5=$(cat "$file" | tr -d "[:space:]" | md5sum | awk '{print $1}')

        if [[ $md5s =~ $md5 ]]; then
          # echo "... skipping $file $md5"
          continue
        fi

        if [[ $file =~ "failable" ]]; then
            # echo "Applying failable $file"
            set +e
            psql < "$file"
            retval=$?
            if [[ $retval -ne 0 ]]; then
              echo "Failable: $file failed: $retval"
            fi
            set -e
        else
            echo "Applying $file"
            psql < "$file"

            # if test mode, run migration again to ensure idempotent
            if [[ $is_test == "test" ]]; then
              echo "RE-Applying $file"
              psql < "$file"
            fi
        fi

        psql -c "INSERT INTO $MIGRATIONS_TABLE (file_name, md5) VALUES ('$file', '$md5') on conflict(file_name) do update set md5='$md5', applied_at=now();"
    done
}

test_dir() {
  migration_files=$(ls "$1"/*.sql | sort -V)

    for file in $migration_files; do
        echo "TEST $file"
        psql < "$file"
    done
}

migrate() {
    create_migrations_table

    migrate_dir "migrations"
    migrate_dir "functions"

    # "preflight" files run before server starts
    # to satisfy any necessary preconditions (e.g. inserting initial block)
    # the intention is to run "preflight" files for all environments EXCEPT test
    if [[ $PG_MIGRATE_TEST_MODE != "true" ]]; then
        migrate_dir "preflight"
    fi
}

run_tests() {
    # test idempotency
    echo "-- test idempotency --"
    migrate

    # run tests dir
    echo "-- sql tests --"
    test_dir "tests"
}

main() {
    case "$1" in
        "test") run_tests;;
        *) migrate
    esac
}

main "$@"
