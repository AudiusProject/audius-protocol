set -e

pylint src/
pylint tests/
isort --check-only src/
isort --check-only tests/
black --check src/
black --check tests/
mypy --ignore-missing-imports --follow-imports=silent --show-column-numbers src/
