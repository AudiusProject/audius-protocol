set -e

pylint src/
pylint integration_tests/
mypy --ignore-missing-imports --follow-imports=silent --show-column-numbers src/