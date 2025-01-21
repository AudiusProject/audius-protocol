isort --diff --check . --skip ./src/tasks/core/gen --skip ./plugins
flake8 . --exclude=./src/tasks/core/gen,./plugins
black --diff --check . --exclude './src/tasks/core/gen|./plugins'
mypy . --exclude './src/tasks/core/gen|./plugins'

