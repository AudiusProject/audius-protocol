FROM golang:1.21.4-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
ENV CGO_ENABLED=0
# Cache deps before building and copying source
RUN go mod download
COPY . .
RUN go build -o /uptime

FROM alpine:3.18.4 AS final
RUN apk add --no-cache curl
COPY --from=builder /uptime /bin/uptime
ENTRYPOINT ["/bin/uptime"]
