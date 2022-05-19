FROM gliderlabs/logspout:v3.2.14

# add a custom healthchecker
RUN apk add --update net-tools
COPY healthcheck.sh /
HEALTHCHECK --interval=30s --timeout=20s \
  CMD /healthcheck.sh || exit 1

# ignores previously log on startup
# could be lossy if the container restarts
# could send double logs upon container restarts if we remove this
ENV BACKLOG false

CMD export SYSLOG_STRUCTURED_DATA=${audius_loggly_token}@41058 tag="${audius_loggly_tags}" \
    && multiline+syslog+tcp://logs-01.loggly.com:514

ARG git_sha
ENV GIT_SHA=${git_sha}

ARG audius_loggly_token
ENV audius_loggly_token ${audius_loggly_token}
