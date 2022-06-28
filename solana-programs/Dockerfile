FROM rust:1.60.0

WORKDIR /usr/src/app

ENV PATH="/root/solana-release/bin:${PATH}"
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && \
    apt-get install -y jq build-essential libudev-dev libhidapi-dev pkg-config libssl-dev git nodejs && \
    npm install -g yarn @project-serum/anchor-cli@0.24.1 && \
    curl -SfL https://github.com/solana-labs/solana/releases/download/v1.10.11/solana-release-x86_64-unknown-linux-gnu.tar.bz2 | tar jxf - -C $HOME

COPY anchor/audius-data/package.json anchor/audius-data/yarn.lock anchor/audius-data/
RUN cd anchor/audius-data && yarn install

ENV CARGO_INCREMENTAL=1

ARG AUDIUS_ETH_REGISTRY_PRIVATE_KEY
ARG TRACK_LISTEN_COUNT_PRIVATE_KEY
ARG CLAIMABLE_TOKENS_PRIVATE_KEY
ARG REWARD_MANAGER_PRIVATE_KEY
ARG AUDIUS_DATA_PRIVATE_KEY

COPY . .
RUN --mount=type=cache,target=/usr/src/app/target-cache \
    --mount=type=cache,target=/root/.cache/solana \
    --mount=type=cache,target=/usr/local/cargo/registry \
    CARGO_TARGET_DIR=/usr/src/app/target-cache ./scripts/build.sh && \
    mkdir -p target target/debug anchor/audius-data/target && \
    cp -r target-cache/deploy target/ && \
    cp target-cache/debug/*-cli target/debug && \
    cp -r target-cache/deploy anchor/audius-data/target/

ARG BUILD_ID
LABEL prune=true
LABEL build=$BUILD_ID

CMD [ "./scripts/deploy.sh" ]
