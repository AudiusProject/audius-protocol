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

COPY . .
RUN cargo build-bpf && \
    cargo build -p audius-eth-registry-cli && \
    cargo build -p claimable-tokens-cli && \
    cargo build -p audius-reward-manager-cli && \
    cd anchor/audius-data && \
    anchor build

ARG BUILD_ID
LABEL prune=true
LABEL build=$BUILD_ID

CMD [ "bash", "start.sh" ]
