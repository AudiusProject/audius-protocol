#!/bin/env bash
set -ex

# See https://circleci.com/docs/runner-installation-linux/
# Self-hosted runners should link to this file as the startup script.

# Stop circleci if it exists and is running
systemctl stop circleci.service &>/dev/null || true
systemctl disable circleci.service &>/dev/null || true


# set platform used for circleci installer and token
export platform="linux/amd64"
gcp_key="circleci-auth-token"
cpus="$(lscpu | grep -E '^CPU\(s\)\:\s+[0-9]+$' | awk '{print $2}')"

case "$(uname -m)" in
    "arm64" | "aarch64" | "arm")
        platform="linux/arm64"
        gcp_key="circleci-auth-token-arm"
        ;;
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


# download and run circleci agent installer script
curl -L https://raw.githubusercontent.com/CircleCI-Public/runner-installation-files/main/download-launch-agent.sh -o download-launch-agent.sh
sh ./download-launch-agent.sh
rm download-launch-agent.sh


# setup user and dirs
id -u circleci &>/dev/null || adduser --disabled-password --gecos GECOS circleci
groupadd -f docker
usermod -aG docker circleci
mkdir -p /var/opt/circleci
chmod 0750 /var/opt/circleci
chown -R circleci /var/opt/circleci /opt/circleci


# setup config
mkdir -p /etc/opt/circleci && touch /etc/opt/circleci/launch-agent-config.yaml
chown -R circleci: /etc/opt/circleci
chmod 600 /etc/opt/circleci/launch-agent-config.yaml
cat <<EOT > /etc/opt/circleci/launch-agent-config.yaml
api:
  auth_token: $(gcloud secrets versions access 1 --secret=$gcp_key)

runner:
  name: $(hostname)
  working_directory: /var/opt/circleci/workdir
  cleanup_working_directory: true
EOT


# allow sudo
echo "circleci ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/circleci
chmod 440 /etc/sudoers.d/circleci


# setup circleci systemd service
touch /usr/lib/systemd/system/circleci.service
chown root: /usr/lib/systemd/system/circleci.service
chmod 755 /usr/lib/systemd/system/circleci.service
cat <<EOT > /usr/lib/systemd/system/circleci.service
[Unit]
Description=CircleCI Runner
After=network.target
[Service]
ExecStart=/opt/circleci/circleci-launch-agent --config /etc/opt/circleci/launch-agent-config.yaml
Restart=always
User=circleci
NotifyAccess=exec
TimeoutStopSec=18300
[Install]
WantedBy = multi-user.target
EOT
systemctl enable circleci.service
systemctl start circleci.service


# Periodically clean up local docker registry
curl -L https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/.circleci/scripts/periodic-cleanup -o /usr/local/sbin/periodic-cleanup
chmod 755 /usr/local/sbin/periodic-cleanup

cleanup_comment='# circleci runner auto-prune'

# remove existing cleanup job from crontab if present
tmpcron="$(mktemp)"
grep -v "$cleanup_comment" /etc/crontab > "$tmpcron"
cat "$tmpcron" > /etc/crontab

# re-add cleanup job
echo '*/10 * * * *   root    /usr/local/sbin/periodic-cleanup | logger -t cleanup  '"$cleanup_comment" >> /etc/crontab

# remove deprecated hourly cleanup script
rm /etc/cron.hourly/audius-ci-hourly || true
