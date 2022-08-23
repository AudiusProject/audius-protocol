#!/usr/bin/env bash

# crontab
# */10 * * * * cd ~/audius-protocol/monitoring && scripts/cron-alerts.sh > /tmp/cron-alerts.log

set -ex

# remove all stale alerts
rm grafana/alerts/*

./grafana/bin/extract-alerts.sh
./grafana/bin/upload-alerts.sh
