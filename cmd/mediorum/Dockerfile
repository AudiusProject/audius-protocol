FROM golang:1.23-bullseye AS go-builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY ./pkg ./pkg
COPY ./cmd/mediorum ./cmd/mediorum

RUN go build -o /bin/mediorum cmd/mediorum/main.go
RUN go build -o /bin/mediorum-cmd pkg/mediorum/cmd/main.go

FROM audius/cpp:latest

COPY --from=go-builder /bin/mediorum /bin/mediorum
COPY --from=go-builder /bin/mediorum-cmd /bin/mediorum-cmd

ARG git_sha
ENV GIT_SHA=$git_sha

VOLUME ["/mediorum_data"]
EXPOSE 1991

ENTRYPOINT ["/bin/mediorum"]
