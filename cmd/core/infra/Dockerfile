ARG GO_VERSION=1.22.5
FROM golang:${GO_VERSION} AS build
WORKDIR /src

ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod download -x
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY ./pkg ./pkg
COPY ./cmd/core ./

ARG git_sha
RUN go build -ldflags "-X github.com/AudiusProject/audius-protocol/pkg/core/config.Version=${git_sha}" -o /bin/server .

FROM alpine:latest AS final

RUN apk --update add \
  jq \
  curl \
  ca-certificates \
  tzdata \
  && \
  update-ca-certificates


COPY --from=build /bin/server /bin/

ENTRYPOINT [ "/bin/server" ]
