set -e

cd $PROTOCOL_DIR
pylint discovery-provider/src/
pylint discovery-provider/tests/
isort --check-only discovery-provider/src/
isort --check-only discovery-provider/tests/
black --check discovery-provider/src/
black --check discovery-provider/tests/
mypy --ignore-missing-imports --follow-imports=silent --show-column-numbers discovery-provider/src/
