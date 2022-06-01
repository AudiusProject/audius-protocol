FROM docker.elastic.co/beats/metricbeat:8.2.0

ARG ELASTIC_ENDPOINT
ARG ELASTIC_CLOUD_ID
ARG ELASTIC_USER
ARG ELASTIC_PASS
ARG git_sha

CMD ELASTIC_ENDPOINT=$(echo ${ELASTIC_ENDPOINT} | base64 -d) \
    ELASTIC_CLOUD_ID=$(echo ${ELASTIC_CLOUD_ID} | base64 -d) \
    API_ID=$(echo ${API_ID} | base64 -d) \
    API_KEY=$(echo ${API_KEY} | base64 -d) \
    -E output.elasticsearch.hosts=["${ELASTIC_ENDPOINT}"] \
    -E cloud.id="${ELASTIC_CLOUD_ID}" \
    -E cloud.auth="${API_ID}:${API_KEY}"
