FROM docker.elastic.co/beats/filebeat-oss:8.2.0

ARG ELASTIC_ENDPOINT
ARG ELASTIC_USER
ARG ELASTIC_PASS

COPY filebeat.docker.yml /tmp/filebeat.yml
USER root
RUN apt-get update \
    && apt-get install -y gettext-base
RUN export ELASTIC_ENDPOINT=${ELASTIC_ENDPOINT} \
    && envsubst < /tmp/filebeat.yml > /usr/share/filebeat/filebeat.yml \
    && chown root /usr/share/filebeat/filebeat.yml \
    && chmod go-w /usr/share/filebeat/filebeat.yml
USER filebeat
