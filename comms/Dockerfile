FROM golang:alpine AS builder

ARG GOOS=linux
ARG GOARCH=amd64

ENV GOOS=${GOOS}
ENV GOARCH=${GOARCH}
ENV GO111MODULE=on
ENV CGO_ENABLED=0

RUN apk add build-base curl ffmpeg make
RUN go install github.com/nats-io/nats-server/v2@v2.9.15 && \
  go install github.com/nats-io/natscli/nats@latest && \
  go install github.com/nats-io/nkeys/nk@latest && \
  go install github.com/nats-io/nsc/v2@latest && \
  go install github.com/amacneil/dbmate@latest && \
  go install github.com/cosmtrek/air@latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY . .
RUN go build -ldflags="-w -s" -o comms main.go

EXPOSE 4222
VOLUME ["/tmp"]
ENTRYPOINT ["air"]

FROM alpine AS final

RUN apk add curl ffmpeg

COPY --from=builder /go/bin/* /bin
COPY --from=builder /app/comms /bin/comms

VOLUME ["/tmp"]
ENTRYPOINT ["comms"]
