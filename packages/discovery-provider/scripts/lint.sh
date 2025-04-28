#!/bin/bash
isort . --skip ./src/tasks/core/gen --skip ./plugins --skip ./src/tasks/core/audiusd_gen
flake8 . --exclude=./src/tasks/core/gen,./plugins,./src/tasks/core/audiusd_gen
black . --exclude './src/tasks/core/gen|./plugins|./src/tasks/core/audiusd_gen'
mypy . --exclude './src/tasks/core/gen|./plugins|./src/tasks/core/audiusd_gen'
