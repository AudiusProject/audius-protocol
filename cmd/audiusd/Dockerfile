FROM debian:bullseye AS cpp-builder

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    gcc \
    ffmpeg \
    libmp3lame-dev \
    python3.9 \
    python3-pip \
    libsndfile1-dev \
    libeigen3-dev \
    libyaml-dev \
    libfftw3-dev \
    libavcodec-dev \
    libavfilter-dev \
    libavformat-dev \
    libavutil-dev \
    libswresample-dev \
    libavresample-dev \
    libsamplerate0-dev \
    libtag1-dev \
    libchromaprint-dev \
    libopus-dev \
    libvorbis-dev \
    libogg-dev \
    libflac-dev

ENV PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:/usr/lib/pkgconfig:/usr/lib/aarch64-linux-gnu/pkgconfig"
ENV LD_LIBRARY_PATH="/usr/local/lib:/usr/lib"

# build and install libKeyFinder (static)
RUN git clone https://github.com/mixxxdj/libKeyFinder.git /libKeyFinder && \
    cd /libKeyFinder && \
    cmake -DCMAKE_INSTALL_PREFIX=/usr/local -DBUILD_SHARED_LIBS=OFF -S . -B build && \
    cmake --build build --parallel $(nproc) && \
    cmake --install build

# build and install Essentia (static)
RUN git clone https://github.com/MTG/essentia.git /essentia && \
    cd /essentia && \
    git checkout v2.1_beta5 && \
    python3 waf configure --build-static --no-msse --pkg-config-path=$PKG_CONFIG_PATH && \
    python3 waf && \
    python3 waf install

# build and install libtag (static)
RUN git clone https://github.com/taglib/taglib.git /taglib && \
    cd /taglib && \
    git submodule update --init && \
    cmake -DBUILD_SHARED_LIBS=OFF -DCMAKE_INSTALL_PREFIX=/usr/local -S . -B build && \
    cmake --build build --parallel $(nproc) && \
    cmake --install build

# build and install libchromaprint (static)
RUN git clone https://github.com/acoustid/chromaprint.git /chromaprint && \
    cd /chromaprint && \
    cmake -DBUILD_SHARED_LIBS=OFF -DCMAKE_INSTALL_PREFIX=/usr/local -S . -B build && \
    cmake --build build --parallel $(nproc) && \
    cmake --install build

WORKDIR /app
COPY ./cmd/mediorum/cpp ./cpp

# build analyze-key cpp (static and dynamic linking)
RUN g++ -o /bin/analyze-key /app/cpp/keyfinder.cpp \
    -I/usr/local/include -L/usr/local/lib \
    -Wl,-Bstatic -lkeyfinder -lsndfile -lfftw3 -lfftw3f \
    -Wl,-Bdynamic -lopus -lFLAC -lvorbis -lvorbisenc -logg -lpthread -lz && \
    chmod +x /bin/analyze-key

# build analyze-bpm cpp (static and dynamic linking)
RUN g++ -o /bin/analyze-bpm /app/cpp/bpm-analyzer.cpp \
    -I/usr/include/eigen3 -I/usr/local/include/essentia -I/usr/local/include \
    -L/usr/local/lib \
    -Wl,-Bstatic -lessentia -ltag -lyaml -lfftw3 -lfftw3f \
    -Wl,-Bdynamic -lavcodec -lavformat -lavutil -lavfilter -lsamplerate -lavresample -lpthread -lz -lchromaprint && \
    chmod +x /bin/analyze-bpm


FROM golang:1.22-bullseye AS go-builder

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
COPY ./cmd/audiusd/main.go ./cmd/audiusd/main.go
RUN go build -o audiusd cmd/audiusd/main.go


FROM debian:bullseye-slim AS final

# TODO: some dynamic libs still required for cpp bins
RUN apt-get update && apt-get install -y \
    wget \
    gnupg2 \
    lsb-release \
    ca-certificates \
    curl \
    ffmpeg \
    libsamplerate0 \
    postgresql \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY --from=cpp-builder /bin/analyze-key /bin/analyze-bpm /bin/
COPY --from=go-builder /app/audiusd /bin/audiusd

RUN mkdir -p /env && \
    curl -o /env/stage.env https://raw.githubusercontent.com/AudiusProject/audius-docker-compose/refs/heads/stage/creator-node/stage.env && \
    curl -o /env/prod.env https://raw.githubusercontent.com/AudiusProject/audius-docker-compose/refs/heads/stage/creator-node/prod.env

COPY ./cmd/audiusd/entrypoint.sh /bin/entrypoint.sh
RUN chmod +x /bin/entrypoint.sh

RUN mkdir -p /data && chown -R postgres:postgres /data

ARG git_sha
ENV GIT_SHA=$git_sha

EXPOSE 80
EXPOSE 443
EXPOSE 26656

VOLUME ["/data"]

ENTRYPOINT ["/bin/entrypoint.sh"]
