FROM golang:1.21.4-alpine AS go-builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /uptime

FROM alpine:3.18.4 AS final
RUN apk add --no-cache curl
COPY --from=go-builder /uptime /bin/uptime

ENTRYPOINT ["/bin/uptime"]
