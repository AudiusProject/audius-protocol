#!/usr/bin/env bash

set -ex

scripts/deploy.sh

./grafana/bin/create-data-sources.sh
./grafana/bin/upload-dashboards.sh
./grafana/bin/upload-library-panels.sh
