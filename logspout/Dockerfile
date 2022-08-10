ARG TAG=v3.2.14-dm-test-1
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
COPY start.sh /start.sh
CMD /start.sh
