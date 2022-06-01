# Logging for Remote Dev

* [Elastic Deployment](https://cloud.elastic.co/deployments/814a17235d004d12bb315e8d466e32e3)
* [Fleet](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/fleet/agents)
* [Docker Logs](https://bit.ly/3wqEWYS)
* [Docker Metrics](https://audius-1.kb.us-central1.gcp.cloud.es.io:9243/app/kibana#/dashboard/docker-AV4REOpp5NkDleZmzKkE)


## Build

```bash
API_CREDS=$(./bin/create-sp-es-api-keys.sh)
API_ID=$(echo ${API_CREDS} | jq -j .id)
API_KEY=$(echo ${API_CREDS} | jq -j .api_key)
. .env

FILEBEAT_VERSION=$(head -n1 filebeat/Dockerfile | cut -f 2 -d ':')
docker build \
        -t audius/filebeat:${FILEBEAT_VERSION} \
        --build-arg git_sha=$(git rev-parse HEAD) \
        --build-arg ELASTIC_ENDPOINT=${ELASTIC_ENDPOINT} \
        --build-arg ELASTIC_CLOUD_ID=${ELASTIC_CLOUD_ID} \
        --build-arg API_ID=${API_ID} \
        --build-arg API_KEY=${API_KEY} \
        filebeat \
    && docker push audius/filebeat:${FILEBEAT_VERSION}

METRICBEAT_VERSION=$(head -n1 metricbeat/Dockerfile | cut -f 2 -d ':')
docker build \
        -t audius/metricbeat:${METRICBEAT_VERSION} \
        --build-arg git_sha=$(git rev-parse HEAD) \
        --build-arg ELASTIC_ENDPOINT=${ELASTIC_ENDPOINT} \
        --build-arg ELASTIC_CLOUD_ID=${ELASTIC_CLOUD_ID} \
        --build-arg API_ID=${API_ID} \
        --build-arg API_KEY=${API_KEY} \
        metricbeat \
    && docker push audius/metricbeat:${METRICBEAT_VERSION}
```