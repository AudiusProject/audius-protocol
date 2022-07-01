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

Filter the logs by using a filter on `audius.hostname`. This can be done by finding
`audius.hostname` under the `Available fields` section within the left sidebar.
The value of the filter will match GCP's instance's `Name` field.
Additionally, the most common filters will be under `audius.*` and `json.*`.

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
* Additional Quick Links:
    * [Fleet](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/fleet/agents)
    * [Docker Metrics](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/kibana#/dashboard/docker-AV4REOpp5NkDleZmzKkE)
    * [Data Views](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/management/kibana/dataViews)
    * [Indices](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/management/data/index_management/indices)
* Additional Getting Started Guides:
    * [Filebeat Documentation](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-overview.html)
    * [Metricbeat Documentation](https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-overview.html)
    * [Using Fleet and Elastic Agent](https://www.elastic.co/guide/en/fleet/current/fleet-elastic-agent-quick-start.html)
    * [Using Cloud ID](https://www.elastic.co/guide/en/cloud-enterprise/current/ece-cloud-id.html)


## Build and Test Locally

The developer flow is similar to the release flow in that:

* `${CURRENT_INDEX_VERSION}` is used as a Docker build arg
* `filebeat` and `metricbeat` Docker images are built using Docker build args

However, while `dev-image.sh` is a wrapper around `build-image.sh` (which is used to release new Docker images), a few differences within `dev-image.sh` are:

* `${CURRENT_INDEX_VERSION}` is incremented prior to building the Docker images to always provide a clean index to develop against
* an Elastic Search data view is created to allow our newly created index to be visible within Kibana
* Docker images are not pushed to Docker Hub
* new Docker images are not pulled from Docker Hub to ensure we test against the most recent, locally-built image

```bash
# copy contents to ~/audius-protocol/logging/.env
ssh prometheus-grafana-metrics "cat ~/audius-protocol/logging/.env"

./bin/dev-image.sh
```

## Build and Release to Docker Hub

When building and releasing Docker images to Docker Hub, we assume that the Developer Flow had previously:

* incremented `${CURRENT_INDEX_VERSION}` in case the old index was incompatible with the new configuration
* created an Elastic Search data view that matches the `${CURRENT_INDEX_VERSION}` to be released

```bash
# copy contents to ~/audius-protocol/logging/.env
ssh prometheus-grafana-metrics "cat ~/audius-protocol/logging/.env"

./bin/build-image.sh push
```

Since `A run monitoring up` will always perform `docker-compose pull`, all developer environments will use the latest sidecars writing to the updated indexes after rerunning `A run monitoring up`.
