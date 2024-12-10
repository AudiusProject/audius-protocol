FROM golang:1.23 AS builder

WORKDIR /app

COPY go.mod go.sum ./
COPY ./cmd ./cmd
COPY ./pkg ./pkg

RUN go mod tidy
RUN go build -o main ./cmd/audio-analysis-backfill/main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .

CMD ["./main"]
