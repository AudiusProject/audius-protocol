FROM ubuntu:20.04

ENV NODE_VERSION="v14.18.1"
ENV HOME="/root"
ENV PATH="${HOME}/.nvm/versions/node/${NODE_VERSION}/bin:${PATH}"

WORKDIR /usr/src/app

RUN ln -snf /usr/share/zoneinfo/UTC /etc/localtime && \
    echo UTC > /etc/timezone

RUN apt-get update && \
    apt-get install -y jq curl build-essential libudev-dev libhidapi-dev pkg-config libssl-dev git python-is-python3 python3-pip && \
    pip3 install --no-cache-dir web3 && \
    curl -s --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

ENV PATH="/root/.cargo/bin:${PATH}"

RUN rustup install 1.55.0 && \
    sh -c "$(curl -sSfL https://release.solana.com/v1.9.13/install)"

ENV PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"

# Install node / npm / yarn.
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
ENV NVM_DIR="${HOME}/.nvm"
RUN . $NVM_DIR/nvm.sh && \
    nvm install ${NODE_VERSION} && \
    nvm use ${NODE_VERSION} && \
    nvm alias default node && \
    npm install -g yarn

# Install anchor.
RUN cargo install --git https://github.com/project-serum/anchor --tag v0.24.1 anchor-cli --locked

COPY audius_eth_registry audius_eth_registry
COPY track_listen_count track_listen_count
COPY cli cli
COPY claimable-tokens claimable-tokens
COPY reward-manager reward-manager

RUN cd audius_eth_registry && \
    cargo build-bpf && \
    cd ../track_listen_count && \
    cargo build-bpf  && \
    cd ../cli && \
    cargo build && \
    cd ../claimable-tokens/program && \
    cargo build-bpf && \
    cd ../cli && \
    cargo build && \
    cd ../../reward-manager/program && \
    cargo build-bpf && \
    cd ../cli && \
    cargo build

ARG BUILD_ID
LABEL prune=true
LABEL build=$BUILD_ID
COPY anchor anchor
RUN cd anchor/audius-data && \
    anchor build 

COPY start.sh ./

CMD [ "bash", "start.sh" ]
