# ELK Logging for Developer Environments

This allows us to use centralized logging with advanced search and UI features to debug
issues seen within developer environments.

## Start Logging Sidecars

```bash
A run logging up
```

Visit [Kibana](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/discover#/view/34f13000-eed1-11ec-8016-d75b5a9924cc).

Filter the logs by using a filter on `audius.hostname`. Additionally, the most common
filters will be under `audius.*` and `json.*`.

If this is your first time, view this [tutorial](https://www.elastic.co/guide/en/kibana/8.2/document-explorer.html).

## Other Useful Links

* [Elastic Deployment](https://cloud.elastic.co/deployments/814a17235d004d12bb315e8d466e32e3)
* [Fleet](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/fleet/agents)
* [Docker Metrics](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/kibana#/dashboard/docker-AV4REOpp5NkDleZmzKkE)

## Test Modifications

```bash
# copy contents to ~/audius-protocol/logging/.env
ssh prometheus-grafana-metrics "cat ~/audius-protocol/logging/.env"

./bin/dev-image.sh
```

## Build and Deploy to Docker Hub

```bash
# copy contents to ~/audius-protocol/logging/.env
ssh prometheus-grafana-metrics "cat ~/audius-protocol/logging/.env"

./bin/build-image.sh push
```
