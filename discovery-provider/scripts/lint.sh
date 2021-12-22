set -e

cd $PROTOCOL_DIR
pylint discovery-provider/src/
pylint discovery-provider/integration_tests/
isort --check-only discovery-provider/src/
isort --check-only discovery-provider/integration_tests/
black --check discovery-provider/src/
black --check discovery-provider/integration_tests/
mypy --ignore-missing-imports --follow-imports=silent --show-column-numbers discovery-provider/src/
