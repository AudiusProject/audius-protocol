# Manually built and pushed to https://hub.docker.com/r/audius/exporter-redis
FROM quay.io/oliver006/redis_exporter:v1.44.0-alpine

COPY docker-entrypoint.sh /docker-entrypoint.sh
ENTRYPOINT [ "/docker-entrypoint.sh" ]
CMD
