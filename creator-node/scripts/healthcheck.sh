#!/usr/bin/env bash

curl -f http://localhost:${port}/health_check || exit 1
