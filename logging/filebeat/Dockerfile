FROM docker.elastic.co/beats/filebeat:8.2.0

USER root
RUN apt-get update \
    && apt-get install -y gettext-base

ARG ELASTIC_ENDPOINT
ARG ELASTIC_CLOUD_ID
ARG API_ID
ARG API_KEY
ARG git_sha

ARG CURRENT_INDEX_VERSION
ENV CURRENT_INDEX_VERSION ${CURRENT_INDEX_VERSION}

COPY filebeat.docker.yml /tmp/filebeat.yml
RUN ELASTIC_ENDPOINT=$(echo ${ELASTIC_ENDPOINT} | base64 -d) \
    ELASTIC_CLOUD_ID=$(echo ${ELASTIC_CLOUD_ID} | base64 -d) \
    API_ID=$(echo ${API_ID} | base64 -d) \
    API_KEY=$(echo ${API_KEY} | base64 -d) \
    envsubst < /tmp/filebeat.yml > /usr/share/filebeat/filebeat.yml \
    && chown root /usr/share/filebeat/filebeat.yml \
    && chmod go-w /usr/share/filebeat/filebeat.yml
USER filebeat

COPY start.sh /start.sh
ENTRYPOINT ["/usr/bin/tini", "-s", "--"]
CMD ["/start.sh"]
