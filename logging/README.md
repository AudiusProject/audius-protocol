# ELK Logging for Developer Environments

This allows us to use centralized logging with advanced search and UI features to debug
issues seen within developer environments.

## Start Logging Sidecars

```bash
A run logging up
```

Visit [Kibana](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/discover#/view/48085400-f27a-11ec-b372-d5cf9468d92b).
When not using the direct link and within the
`Analytics -> Discover` view, click `Open` to load the `Audius.v2` dashboard.

Filter the logs by using a filter on `audius.hostname`. Additionally, the most common
filters will be under `audius.*` and `json.*`.

Each bump of the logging container will cause a new
`filebeat-${VERSION}-(app|beats|db|misc)` data view based on the newly versioned indices.
Each data view has been logically separated:

* `app`: discovery-provider, content-nodes, and identity service logs
* `beats`: filebeats and metricbeat containers' logs
* `db`: all postgres and redis db logs
* `misc`: all other containers that have not yet been "promoted" to the other data views

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
