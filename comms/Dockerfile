FROM golang:alpine AS builder

ENV GO111MODULE=on
ENV CGO_ENABLED=0

RUN go install github.com/amacneil/dbmate@latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY . .
RUN go build -ldflags="-w -s" -o comms main.go

EXPOSE 4222
VOLUME ["/tmp"]
ENTRYPOINT ["air"]

FROM alpine AS final


COPY --from=builder /go/bin/* /bin
COPY --from=builder /app/comms /bin/comms
COPY --from=builder /app/discovery/db/migrations /discovery/db/migrations

VOLUME ["/tmp"]
ENTRYPOINT ["comms"]
