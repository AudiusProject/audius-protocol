#!/usr/bin/env bash

if [ -n "${FIX_LINT}" ]; then
  ISORT_FLAG=
  BLACK_FLAG=
else
  ISORT_FLAG='--check-only'
  BLACK_FLAG='--check'
fi

set -ex

flake8 $PROTOCOL_DIR/discovery-provider/src/
flake8 $PROTOCOL_DIR/discovery-provider/integration_tests/
isort ${ISORT_FLAG} $PROTOCOL_DIR/discovery-provider/src/
isort ${ISORT_FLAG} $PROTOCOL_DIR/discovery-provider/integration_tests/
black ${BLACK_FLAG} $PROTOCOL_DIR/discovery-provider/src/
black ${BLACK_FLAG} $PROTOCOL_DIR/discovery-provider/integration_tests/
mypy $PROTOCOL_DIR/discovery-provider
