# Manually built and pushed to https://hub.docker.com/r/audius/exporter-postgres
FROM quay.io/prometheuscommunity/postgres-exporter:v0.10.1

COPY docker-entrypoint.sh /bin/docker-entrypoint.sh
ENTRYPOINT [ "/bin/docker-entrypoint.sh" ]
CMD
