FROM rust:1.60.0

WORKDIR /usr/src/app

ENV PATH="/root/solana-release/bin:${PATH}"
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && \
    apt-get install -y jq build-essential libudev-dev libhidapi-dev pkg-config libssl-dev git nodejs && \
    npm install -g yarn @project-serum/anchor-cli && \
    curl -SfL https://github.com/solana-labs/solana/releases/download/v1.10.11/solana-release-x86_64-unknown-linux-gnu.tar.bz2 | tar jxf - -C $HOME

# NOTE: Use follwing and comment above if you are on M1
# ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"
# RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && \
#     apt-get install -y jq build-essential libudev-dev libhidapi-dev pkg-config libssl-dev git nodejs && \
#     npm install -g yarn && \
#     sh -c "$(curl -sSfL https://release.solana.com/v1.9.13/install)" && \
#     cargo install --git https://github.com/project-serum/anchor --tag v0.24.1 anchor-cli --locked

COPY anchor/audius-data/package.json anchor/audius-data/yarn.lock anchor/audius-data/
RUN cd anchor/audius-data && yarn install

ENV CARGO_INCREMENTAL=1

ARG AUDIUS_ETH_REGISTRY_PRIVATE_KEY
ARG TRACK_LISTEN_COUNT_PRIVATE_KEY
ARG CLAIMABLE_TOKENS_PRIVATE_KEY
ARG REWARD_MANAGER_PRIVATE_KEY
ARG AUDIUS_DATA_PRIVATE_KEY

COPY . .
RUN --mount=type=cache,target=/tmp/cache \
    --mount=type=cache,target=/root/.cache/solana \
    --mount=type=cache,target=/usr/local/cargo/registry \
    cp -r * /tmp/cache && \
    cd /tmp/cache && \
    bash scripts/build.sh && \
    mkdir -p /usr/src/app/target/debug /usr/src/app/target/deploy && \
    cp target/debug/* /usr/src/app/target/debug/ | true && \
    cp target/deploy/* /usr/src/app/target/deploy/ && \
    mkdir -p /usr/src/app/anchor/audius-data/target/idl /usr/src/app/anchor/audius-data/target/deploy && \
    cp anchor/audius-data/target/idl/* /usr/src/app/anchor/audius-data/target/idl && \
    cp anchor/audius-data/target/deploy/* /usr/src/app/anchor/audius-data/target/deploy && \
    cp -r anchor/audius-data/target/types /usr/src/app/anchor/audius-data/target/types

ARG BUILD_ID
LABEL prune=true
LABEL build=$BUILD_ID

CMD [ "./scripts/deploy.sh" ]
