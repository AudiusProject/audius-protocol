set -e

pylint src/
pylint tests/
mypy --ignore-missing-imports --follow-imports=silent --show-column-numbers src/