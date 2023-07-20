#!/usr/bin/env bash

source /etc/os-release
case "$ID" in
debian | ubuntu)
    # Uninstall old versions of docker
    sudo apt-get remove -y docker docker-engine docker.io containerd runc

    # Install packages to allow apt to use a repository over HTTPS
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release

    # Setup repository for docker
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL "https://download.docker.com/linux/$ID/gpg" | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$ID $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

    # Install dependencies
    sudo apt-get update
    sudo apt-get install -y \
        git \
        python3 \
        python3-pip \
        docker-ce \
        docker-ce-cli \
        containerd.io

    mkdir -p ~/.docker/cli-plugins
    curl -L "https://github.com/docker/buildx/releases/download/v0.10.4/buildx-v0.9.1.linux-$(dpkg --print-architecture)" -o ~/.docker/cli-plugins/docker-buildx
    curl -L "https://github.com/docker/compose/releases/download/v2.17.3/docker-compose-linux-$(uname -m)" -o ~/.docker/cli-plugins/docker-compose
    chmod +x ~/.docker/cli-plugins/docker-buildx
    chmod +x ~/.docker/cli-plugins/docker-compose

    # Add user to docker group
    sudo usermod -aG docker "$USER"

    # Increase file watchers
    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
    ;;
*)
    if ! command -v docker &>/dev/null; then
        echo "Docker is not installed. Please install docker and try again."
        exit 1
    fi

    if ! command -v python3 &>/dev/null; then
        echo "Python3 is not installed. Please install python3 and try again."
        exit 1
    fi

    if ! command -v pip3 &>/dev/null; then
        echo "pip3 is not installed. Please install pip3 and try again."
        exit 1
    fi

    if ! docker compose version &>/dev/null; then
        echo "Docker compose v2 is not installed. Please install docker compose v2 and try again."
        exit 1
    fi
    ;;
esac

if [[ "${BASH_SOURCE[0]}" == "" ]]; then
    export PROTOCOL_DIR="${PROTOCOL_DIR:-$HOME/audius-protocol}"
    git clone https://github.com/AudiusProject/audius-protocol.git "$PROTOCOL_DIR"
else
    export PROTOCOL_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
fi

python3 -m pip install -r "$PROTOCOL_DIR/dev-tools/requirements.txt"

mkdir -p "$HOME/.local/bin"

ln -sf "$PROTOCOL_DIR/dev-tools/audius-compose" "$HOME/.local/bin/audius-compose"
ln -sf "$PROTOCOL_DIR/dev-tools/audius-cloud" "$HOME/.local/bin/audius-cloud"
ln -sf "$PROTOCOL_DIR/dev-tools/audius-cmd" "$HOME/.local/bin/audius-cmd"

echo "export PROTOCOL_DIR=$PROTOCOL_DIR" >>~/.profile
echo "export PATH=$HOME/.local/bin:$PATH" >>~/.profile

[[ "$AUDIUS_DEV" != "false" ]] && . "$PROTOCOL_DIR/dev-tools/setup-dev.sh" || true
