FROM gliderlabs/logspout:v3.2.14

RUN apk add --update net-tools

COPY healthcheck.sh /

HEALTHCHECK --interval=30s --timeout=20s \
  CMD /healthcheck.sh || exit 1

# ignores previously logs on startup
# could be lossy if the container restarts
# could send double logs upon container restarts if we remove this
ENV BACKLOG false

CMD export SYSLOG_STRUCTURED_DATA=${LOGGLY_TOKEN}@41058 tag="${audius_loggly_tags}" \
    && multiline+syslog+tcp://logs-01.loggly.com:514

ARG LOGGLY_TOKEN
ENV LOGGLY_TOKEN ${LOGGLY_TOKEN}
