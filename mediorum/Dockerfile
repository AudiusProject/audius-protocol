FROM golang:alpine AS builder

RUN apk add build-base make ffmpeg python3 python3-dev py3-pip

# Install Essentia dependencies
RUN apk add --no-cache --virtual .build-deps git fftw-dev eigen-dev && \
    pip3 install essentia && \
    apk del .build-deps

WORKDIR /app
ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY . .
RUN go build
RUN go build -o mediorum-cmd cmd/main.go

FROM alpine:3.17 AS final

RUN apk add curl ffmpeg python3 py3-pip

COPY --from=builder /go/bin/* /bin
COPY --from=builder /app/mediorum /bin/mediorum
COPY --from=builder /app/mediorum-cmd /bin/mediorum-cmd

# Install Essentia
RUN apk add --no-cache --virtual .build-deps fftw-dev eigen-dev && \
    pip3 install essentia && \
    apk del .build-deps

# ARGs can be optionally defined with --build-arg while doing docker build eg in CI and then set to env vars
ARG git_sha
ENV GIT_SHA=$git_sha

VOLUME ["/mediorum_data"]
EXPOSE 1991
ENTRYPOINT ["mediorum"]
