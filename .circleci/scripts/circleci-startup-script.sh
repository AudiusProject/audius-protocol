#!/bin/env bash
set -ex

# See https://circleci.com/docs/runner-installation-linux/
# Self-hosted runners should link to this file as the startup script.

# Stop circleci if it exists and is running
systemctl stop circleci-runner &>/dev/null || true
systemctl disable circleci-runner &>/dev/null || true


# set platform used for circleci installer and token
export platform="linux/amd64"
gcp_key="circleci-auth-token"
cpus="$(lscpu | grep -E '^CPU\(s\)\:\s+[0-9]+$' | awk '{print $2}')"

case "$(uname -m)" in
    "x86_64" | *)
        platform="linux/amd64"
        case "$cpus" in
            8)
            gcp_key="circleci-auth-token-gcp-n2-standard-8"
            ;;
            4 | *)
            gcp_key="circleci-auth-token"
            ;;
        esac
        ;;
esac


# install basic dependencies
apt install -y git coreutils curl


# download and run circleci cli installer script
curl -s https://packagecloud.io/install/repositories/circleci/runner/script.deb.sh?any=true | bash
apt install -y circleci-runner


# setup config
RUNNER_AUTH_TOKEN="$(gcloud secrets versions access 1 --secret=$gcp_key)"
export RUNNER_AUTH_TOKEN
sed -i "s/<< AUTH_TOKEN >>/$RUNNER_AUTH_TOKEN/g" /etc/circleci-runner/circleci-runner-config.yaml

# allow sudo
echo "circleci ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/circleci
chmod 440 /etc/sudoers.d/circleci

# allow docker
groupadd -f docker
usermod -aG docker circleci

systemctl enable circleci-runner
systemctl start circleci-runner
