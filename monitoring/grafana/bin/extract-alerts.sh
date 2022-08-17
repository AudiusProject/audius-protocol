#!/usr/bin/env bash

# only accept the first argument in "manual" mode
GRAFANA_DASHBOARD_DIR="${1:-grafana/dashboards/}"

echo "Overwriting the contents of ./grafana/alerts/ and ./grafana/dashboards/"
echo -n "Press any key to continue..."
read _

function on-exit {
    # ensure we never commit dashboard IDs 
    ./grafana/bin/save-dashboards.sh
    echo "Dashboard IDs removed."
}
trap on-exit EXIT

set -x

# refresh all dashboards and do not strip the dashboard ID
CLEAR_DASHBOARD_ID=. ./grafana/bin/save-dashboards.sh

json_dashboards=$(find "${GRAFANA_DASHBOARD_DIR}" -name '*.json' -not -name 'library.json')

for json_dashboard in ${json_dashboards}
do
    # extract alerts from these fresh dashboards
    # use the dashboard ID as part of the alert ID
    python3 ./grafana/bin/extract-alerts.py ${json_dashboard}
done
