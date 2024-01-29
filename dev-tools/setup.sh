#!/usr/bin/env bash

set -exo pipefail

[ -f "/etc/os-release" ] && source /etc/os-release
case "$ID" in
debian | ubuntu)
    # Uninstall old versions of docker
    set +e
    for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done
    set -e

    # Install packages to allow apt to use a repository over HTTPS
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release

    # Add Docker's official GPG key:
    if ! [ -f /etc/apt/keyrings/docker.gpg ]; then
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
    fi

    # Add the repository to Apt sources:
    if ! [ -f /etc/apt/sources.list.d/docker.list ]; then
        echo \
            "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
            "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
            sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
    fi

    # Install dependencies
    sudo NEEDRESTART_MODE=l apt-get install -y --allow-downgrades \
        git \
        python3 \
        python3-pip \
        docker-ce \
        docker-ce-cli \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin='2.21.0-1~ubuntu.22.04~jammy'


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

# Add env vars to .profile, avoiding duplication
grep -q PROTOCOL_DIR ~/.profile || echo "export PROTOCOL_DIR=$PROTOCOL_DIR" >>~/.profile
grep -q "export PATH=$HOME/.local/bin:" ~/.profile || echo "export PATH=$HOME/.local/bin:\$PATH" >>~/.profile

[[ "$AUDIUS_DEV" != "false" ]] && . "$PROTOCOL_DIR/dev-tools/setup-dev.sh" || true
