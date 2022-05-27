FROM docker.elastic.co/beats/metricbeat:8.2.0

ARG ELASTIC_ENDPOINT
ARG ELASTIC_CLOUD_ID
ARG ELASTIC_USER
ARG ELASTIC_PASS
ARG git_sha

CMD ELASTIC_ENDPOINT=$(echo ${ELASTIC_ENDPOINT} | base64 --decode) \
    ELASTIC_CLOUD_ID=$(echo ${ELASTIC_CLOUD_ID} | base64 --decode) \
    ELASTIC_USER=$(echo ${ELASTIC_USER} | base64 --decode) \
    ELASTIC_PASS=$(echo ${ELASTIC_PASS} | base64 --decode) \
    -E output.elasticsearch.hosts=["${ELASTIC_ENDPOINT}"] \
    -E cloud.id="${ELASTIC_CLOUD_ID}" \
    -E cloud.auth="${ELASTIC_USER}:${ELASTIC_PASS}"
