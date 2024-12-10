FROM golang:1.23 AS builder

WORKDIR /app

COPY go.mod go.sum ./
COPY ./cmd ./cmd
COPY ./pkg ./pkg

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/audio-analysis-backfill/main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .

RUN chmod +x main
RUN mkdir -p /app/output
VOLUME /app/output

CMD ["/app/main"]
