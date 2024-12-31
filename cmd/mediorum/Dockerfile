FROM golang:1.23-bullseye AS go-builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY ./pkg ./pkg
COPY ./cmd/mediorum ./cmd/mediorum

RUN go build -o /bin/mediorum cmd/mediorum/main.go

FROM audius/cpp:latest

RUN apt-get update && apt-get install -y --no-install-recommends \
  iputils-ping \
  curl && \
  rm -rf /var/lib/apt/lists/*

COPY --from=go-builder /bin/mediorum /bin/mediorum

ARG git_sha
ENV GIT_SHA=$git_sha

VOLUME ["/mediorum_data"]
EXPOSE 1991

ENTRYPOINT ["/bin/mediorum"]
