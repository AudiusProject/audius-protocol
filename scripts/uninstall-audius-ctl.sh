# This script should only be run from the Makefile

set -eo pipefail

if [ -f "/usr/local/bin/audius-ctl" ]; then
    if [ -w "/usr/local/bin/audius-ctl" ]; then
        echo "Uninstalling audius-ctl at /usr/local/bin ..."
        rm /usr/local/bin/audius-ctl
    else
        echo "Insufficient permissions to uninstall at /usr/local/bin"
    fi
fi

if [ -f "$HOME/.local/bin/audius-ctl" ]; then
    echo "Uninstalling audius-ctl at $HOME/.local/bin ..."
    rm "$HOME/.local/bin/audius-ctl"
fi

if [ -f "$HOME/bin/audius-ctl" ]; then
    echo "Uninstalling audius-ctl at $HOME/bin ..."
    rm "$HOME/bin/audius-ctl"
fi
