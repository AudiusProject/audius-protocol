FROM gliderlabs/logspout:v3.2.14

# ignores previously log on startup
# could be lossy if the container restarts
# could send double logs upon container restarts if we remove this
ENV BACKLOG false

ARG git_sha
ENV GIT_SHA=${git_sha}

ARG audius_loggly_token
ENV audius_loggly_token ${audius_loggly_token}

ENTRYPOINT []
CMD audius_loggly_token_64=$(echo ${audius_loggly_token} | base64 -d) \
    && export SYSLOG_STRUCTURED_DATA="${audius_loggly_token_64}@41058 tag=\"logspout\"" \
    && echo SYSLOG_STRUCTURED_DATA=${SYSLOG_STRUCTURED_DATA} \
    && /bin/logspout multiline+syslog+tcp://logs-01.loggly.com:514
