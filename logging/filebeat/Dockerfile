FROM docker.elastic.co/beats/filebeat-oss:8.2.0

ARG ELASTIC_ENDPOINT
ARG ELASTIC_USER
ARG ELASTIC_PASS
# RUN export ELASTIC_ENDPOINT=$(echo ZW5kcG9pbnQK | base64 --decode) \
#     export ELASTIC_AGENT_URL=$(echo dXNlcgo= | base64 --decode) \
#     export ELASTIC_AGENT_TOKEN=$(echo cGFzcwo= | base64 --decode) \

USER root
RUN apt-get update \
    && apt-get install -y gettext-base
COPY filebeat.docker.yml /tmp/filebeat.yml
RUN export ELASTIC_ENDPOINT=${ELASTIC_ENDPOINT} \
    && envsubst < /tmp/filebeat.yml > /usr/share/filebeat/filebeat.yml \
    && chown root /usr/share/filebeat/filebeat.yml \
    && chmod go-w /usr/share/filebeat/filebeat.yml
USER filebeat
