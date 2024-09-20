ARG GO_VERSION=1.22.5
FROM golang:${GO_VERSION} AS build
WORKDIR /src

RUN --mount=type=cache,target=/go/pkg/mod/ \
  --mount=type=bind,source=go.sum,target=go.sum \
  --mount=type=bind,source=go.mod,target=go.mod \
  go mod download -x

COPY . .

ARG git_sha
RUN --mount=type=cache,target=/go/pkg/mod/ \
  CGO_ENABLED=0 go build -ldflags "-X main.Version=${git_sha}" -o /bin/server .

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
