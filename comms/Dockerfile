FROM golang:alpine AS builder

RUN apk add build-base ffmpeg
RUN export GO111MODULE=on && \
  go install github.com/nats-io/nats-server/v2@latest && \
  go install github.com/nats-io/natscli/nats@latest && \
  go install github.com/nats-io/nkeys/nk@latest && \
  go install github.com/nats-io/nsc/v2@latest && \
  go install github.com/cosmtrek/air@latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
	  go build -ldflags="-w -s" -o comms main.go

RUN apk add curl && cd /tmp && \
  curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64 && \
  chmod +x /usr/local/bin/dbmate

EXPOSE 4222
VOLUME ["/tmp"]
ENTRYPOINT ["air"]

FROM alpine AS final

RUN apk add curl ffmpeg && cd /tmp && \
  curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64 && \
  chmod +x /usr/local/bin/dbmate

COPY --from=builder /go/bin/* /bin
COPY --from=builder /app/comms /bin/comms

VOLUME ["/tmp"]
ENTRYPOINT ["comms"]
