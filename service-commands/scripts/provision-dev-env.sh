#!/bin/bash
set -x

export NODE_VERSION="v14.18.1"
export PYTHON_VERSION="3.9"
export NVM_VERSION="v0.35.3"
export DOCKER_COMPOSE_VERSION="1.27.4"

sudo apt update
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    build-essential \
    python-is-python2 \
    python3-pip \
    git-secrets \
    jq

# python setup
sudo add-apt-repository ppa:deadsnakes/ppa # python3.9 installation
sudo apt install -y "python$PYTHON_VERSION"

# docker setup
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository 'deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable'
sudo apt update
sudo apt install -y docker-ce
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
# prevent docker logs from eating all memory
sudo sh -c "cat >/etc/docker/daemon.json" <<EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

sudo chown $USER /etc/hosts

# install nvm and node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VERSION/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install $NODE_VERSION

# profile setup
echo "nvm use $NODE_VERSION" >> ~/.profile
echo 'export PROTOCOL_DIR=$HOME/audius-protocol' >> ~/.profile
echo 'export AUDIUS_REMOTE_DEV_HOST=$(curl -sfL -H "Metadata-Flavor: Google" http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)' >> ~/.profile
source ~/.profile
source ~/.bashrc

# audius repos setup
git clone https://github.com/AudiusProject/audius-client.git
cd $PROTOCOL_DIR/service-commands
npm install
node scripts/hosts.js add
node scripts/setup.js run init-repos up
echo 'Rebooting machine...'
reboot
