FROM golang:alpine AS builder

RUN apk add build-base make ffmpeg

WORKDIR /app

ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY . .

RUN go build
RUN go build -o mediorum-cmd cmd/main.go

FROM alpine:3.17 AS final

RUN apk add curl ffmpeg cmake fftw-dev libsndfile-dev git python3-dev py3-pip build-base
RUN python3 -m pip install numpy aubio

# Build and install libkeyfinder
RUN git clone https://github.com/mixxxdj/libKeyFinder.git /libKeyFinder
WORKDIR /libKeyFinder
RUN cmake -DCMAKE_INSTALL_PREFIX=/usr/local -DBUILD_TESTING=OFF -S . -B build && \
    cmake --build build --parallel $(nproc) && \
    cmake --install build

WORKDIR /app

COPY --from=builder /go/bin/* /bin
COPY --from=builder /app/mediorum /bin/mediorum
COPY --from=builder /app/mediorum-cmd /bin/mediorum-cmd
COPY --from=builder /app/cpp /app/cpp

# Compile the keyfinder C++ executable
RUN g++ -o /bin/analyze-key /app/cpp/keyfinder.cpp -I/usr/local/include -L/usr/local/lib -lkeyfinder -lsndfile && \
    chmod +x /bin/analyze-key

# ARGs can be optionally defined with --build-arg while doing docker build eg in CI and then set to env vars
ARG git_sha
ENV GIT_SHA=$git_sha

VOLUME ["/mediorum_data"]
EXPOSE 1991
ENTRYPOINT ["mediorum"]
