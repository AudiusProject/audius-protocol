# syntax=docker/dockerfile:1

FROM golang:latest

RUN apt update && apt install -y ffmpeg 

# install in-container tools: dbmate, nats cli
RUN export GO111MODULE=on && \
  go install github.com/nats-io/natscli/nats@latest && \
  go install github.com/amacneil/dbmate@latest

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download
COPY . ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /comms-linux

# COPY build/comms-linux-amd64 /comms-linux
# COPY db/migrations ./db/migrations

EXPOSE 8925

VOLUME ["/tmp/nats"]

CMD [ "/comms-linux" ]
