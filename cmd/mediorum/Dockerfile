FROM golang:1.22-bullseye AS builder

RUN apt-get update && apt-get install -y \
    build-essential \
    make \
    ffmpeg \
    libmp3lame-dev

WORKDIR /app

ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod graph | awk '{if ($1 !~ "@") print $2}' | xargs go get

COPY ./pkg ./pkg
COPY ./cmd/mediorum ./

RUN go build -o mediorum
RUN go build -o mediorum-cmd pkg/mediorum/cmd/main.go

FROM debian:bullseye AS final

RUN apt-get update && apt-get install -y \
    build-essential \
    make \
    cmake \
    git \
    curl \
    bash \
    gcc \
    ffmpeg \
    libmp3lame-dev \
    python3.9 \
    python3-pip

# libKeyFinder dependencies
RUN apt-get install -y libsndfile1-dev

# essentia dependencies
RUN apt-get install -y libeigen3-dev libyaml-dev libfftw3-dev libavcodec-dev libavformat-dev libavutil-dev libswresample-dev libavresample-dev libsamplerate0-dev libtag1-dev libchromaprint-dev libavfilter-dev

# Build and install libkeyfinder
RUN git clone https://github.com/mixxxdj/libKeyFinder.git /libKeyFinder
WORKDIR /libKeyFinder
RUN cmake -DCMAKE_INSTALL_PREFIX=/usr/local -DBUILD_TESTING=OFF -S . -B build && \
    cmake --build build --parallel $(nproc) && \
    cmake --install build

# Clone and build Essentia
RUN export PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:$(find /usr/lib -type d -name pkgconfig | tr '\n' ':')" && \
    echo "PKG_CONFIG_PATH=$PKG_CONFIG_PATH" >> /etc/environment
ENV LD_LIBRARY_PATH="/usr/local/lib:/usr/lib"
RUN git clone https://github.com/MTG/essentia.git /essentia
WORKDIR /essentia
RUN git checkout v2.1_beta5 && \
    python3 waf configure --build-static --no-msse --pkg-config-path=$PKG_CONFIG_PATH && \
    python3 waf && \
    python3 waf install

WORKDIR /

COPY --from=builder /go/bin/* /bin
COPY --from=builder /app/mediorum /bin/mediorum
COPY --from=builder /app/mediorum-cmd /bin/mediorum-cmd
COPY --from=builder /app/cpp /app/cpp

# Compile the keyfinder C++ executable
RUN g++ -o /bin/analyze-key /app/cpp/keyfinder.cpp -I/usr/local/include -L/usr/local/lib -lkeyfinder -lsndfile && \
    chmod +x /bin/analyze-key

# Compile the bpm analyzer C++ executable
RUN g++ -o /bin/analyze-bpm /app/cpp/bpm-analyzer.cpp -I/usr/include/eigen3 -I/usr/local/include/essentia -I/usr/local/include -L/usr/local/lib -lessentia -lavcodec -lavformat -lavutil -lavfilter -lsamplerate -ltag -lyaml -lfftw3 -lfftw3f -lfftw3l -lfftw3_threads -lfftw3f_threads -lfftw3l_threads -lavresample -lswresample -lchromaprint && \
    chmod +x /bin/analyze-bpm

# ARGs can be optionally defined with --build-arg while doing docker build eg in CI and then set to env vars
ARG git_sha
ENV GIT_SHA=$git_sha

VOLUME ["/mediorum_data"]
EXPOSE 1991
ENTRYPOINT ["mediorum"]
