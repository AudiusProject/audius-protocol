FROM docker.elastic.co/beats/filebeat:8.2.0

ARG ELASTIC_ENDPOINT
ARG ELASTIC_USER
ARG ELASTIC_PASS
ARG git_sha

USER root
RUN apt-get update \
    && apt-get install -y gettext-base
COPY filebeat.docker.yml /tmp/filebeat.yml
RUN ELASTIC_ENDPOINT=$(echo ${ELASTIC_ENDPOINT} | base64 -d) \
    API_ID=$(echo ${API_ID} | base64 -d) \
    API_KEY=$(echo ${API_KEY} | base64 -d) \
    envsubst < /tmp/filebeat.yml > /usr/share/filebeat/filebeat.yml \
    && chown root /usr/share/filebeat/filebeat.yml \
    && chmod go-w /usr/share/filebeat/filebeat.yml
USER filebeat
