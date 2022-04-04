#!/usr/bin/env bash

# finds all revisions that contains mention of a certain table, field, etc

ELEMENT_NAME=$1

REVS=$(PYTHONPATH=. alembic history | cut -d ' ' -f 3 | sed 's|,||')
for REV in ${REVS}; do
    SHOW=$(PYTHONPATH=. alembic show ${REV} | grep Path | cut -d ':' -f 2)
    if [ -n "${SHOW}" ]; then
        output=$(sift ${ELEMENT_NAME} ${SHOW})
    fi
    echo ${REV} ${output}
done
