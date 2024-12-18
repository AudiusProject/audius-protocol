FROM golang:1.23-bullseye AS build
WORKDIR /src

RUN --mount=type=cache,target=/go/pkg/mod/ \
  --mount=type=bind,source=go.sum,target=go.sum \
  --mount=type=bind,source=go.mod,target=go.mod \
  go mod download -x


ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY ./pkg ./pkg
COPY ./cmd/core ./

ARG git_sha
RUN --mount=type=cache,target=/go/pkg/mod/ \
  go build -ldflags "-X github.com/AudiusProject/audius-protocol/pkg/core/config.Version=${git_sha}" -o /bin/server .

FROM alpine:latest AS final

RUN --mount=type=cache,target=/var/cache/apk \
  apk --update add \
  jq \
  curl \
  ca-certificates \
  tzdata \
  && \
  update-ca-certificates

COPY --from=build /bin/server /bin/

ENTRYPOINT [ "/bin/server" ]
