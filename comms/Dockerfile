FROM golang:alpine AS builder

ENV GO111MODULE=on
ENV CGO_ENABLED=0

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY . .
RUN go build -o comms main.go


FROM alpine AS final


COPY --from=builder /go/bin/* /bin
COPY --from=builder /app/comms /bin/comms

EXPOSE 4222
VOLUME ["/tmp"]
CMD ["comms"]