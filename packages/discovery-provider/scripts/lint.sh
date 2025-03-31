isort . --skip ./src/tasks/core/gen --skip ./plugins
flake8 . --exclude=./src/tasks/core/gen,./plugins
black . --exclude './src/tasks/core/gen|./plugins'
mypy . --exclude './src/tasks/core/gen|./plugins'