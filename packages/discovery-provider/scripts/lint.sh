isort --diff . --skip ./src/tasks/core/gen --skip ./plugins
flake8 . --exclude=./src/tasks/core/gen,./plugins
black --diff . --exclude './src/tasks/core/gen|./plugins'
mypy . --exclude './src/tasks/core/gen|./plugins'