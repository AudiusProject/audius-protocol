FROM golang:1.23-bullseye AS go-builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY ./pkg ./pkg
COPY ./cmd/audiusd/main.go ./cmd/audiusd/main.go
RUN go build -o audiusd cmd/audiusd/main.go

FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    ffmpeg \
    libfftw3-single3 \
    libfftw3-double3 \
    libsndfile1 \
    libaubio5 \
    libopus0 \
    libvorbis0a \
    libogg0 \
    libflac12 \
    postgresql-15 && \
    rm -rf /var/lib/apt/lists/* && \
    update-ca-certificates

RUN mkdir -p /data/postgres && \
    chown -R postgres:postgres /data/postgres && \
    chmod -R 700 /data/postgres

RUN localedef -i en_US -f UTF-8 en_US.UTF-8

COPY --from=audius/cpp:bookworm /bin/analyze-key /bin/
COPY --from=audius/cpp:bookworm /bin/analyze-bpm /bin/
COPY --from=audius/cpp:bookworm /usr/local/lib/libkeyfinder.so* /usr/local/lib/
RUN ldconfig

COPY --from=go-builder /app/audiusd /bin/audiusd

RUN mkdir -p /env
COPY ./cmd/audiusd/env/dev.env ./cmd/audiusd/env/stage.env ./cmd/audiusd/env/prod.env /env/

COPY ./cmd/audiusd/entrypoint.sh /bin/entrypoint.sh
RUN chmod +x /bin/entrypoint.sh

ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

EXPOSE 80
EXPOSE 443
EXPOSE 26656

VOLUME ["/data"]

ENTRYPOINT ["/bin/entrypoint.sh"]
