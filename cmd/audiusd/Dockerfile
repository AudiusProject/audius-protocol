FROM golang:1.23-bullseye AS go-builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY ./pkg ./pkg
COPY ./cmd/audiusd/main.go ./cmd/audiusd/main.go
RUN go build -o audiusd cmd/audiusd/main.go

# encoding and analysis requires a lot of dynamic links
FROM audius/cpp:latest

COPY --from=go-builder /app/audiusd /bin/audiusd

RUN mkdir -p /env
COPY ./cmd/audiusd/env/dev.env ./cmd/audiusd/env/stage.env ./cmd/audiusd/env/prod.env /env/

COPY ./cmd/audiusd/entrypoint.sh /bin/entrypoint.sh
RUN chmod +x /bin/entrypoint.sh

# Set up data directory structure with proper permissions
RUN mkdir -p /data && \
    mkdir -p /data/postgres && \
    chown -R postgres:postgres /data/postgres && \
    chmod -R 700 /data/postgres

RUN localedef -i en_US -f UTF-8 en_US.UTF-8

ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

EXPOSE 80
EXPOSE 443
EXPOSE 26656

# Single volume mount point
VOLUME ["/data"]

ENTRYPOINT ["/bin/entrypoint.sh"]
