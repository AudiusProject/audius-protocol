FROM ubuntu:20.04

WORKDIR /usr/src/app

RUN ln -snf /usr/share/zoneinfo/UTC /etc/localtime && \
    echo UTC > /etc/timezone

RUN apt-get update && \
    apt-get install -y jq curl build-essential libudev-dev libhidapi-dev pkg-config libssl-dev git python-is-python3 python3-pip && \
    pip3 install --no-cache-dir web3 && \
    curl -s --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    sh -c "$(curl -sSfL https://release.solana.com/v1.6.1/install)"

ENV PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"

COPY create_and_verify create_and_verify
COPY program program
COPY cli cli

RUN cd program && \
    cargo build-bpf && \
    cd ../create_and_verify && \
    cargo build-bpf  && \
    cd ../cli && \
    cargo build

COPY start.sh ./

CMD [ "sh", "start.sh" ]
