FROM docker.elastic.co/beats/metricbeat:8.2.0

CMD set -x && metricbeat -e \
    -E output.elasticsearch.hosts=["${ELASTIC_ENDPOINT}"] \
    -E cloud.id="${ELASTIC_CLOUD_ID}" \
    -E cloud.auth="${ELASTIC_USER}:${ELASTIC_PASS}"
