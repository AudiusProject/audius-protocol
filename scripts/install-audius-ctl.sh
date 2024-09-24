# This script should only be run from the Makefile

set -eo pipefail

OS="$(uname -s)"
ARCH="$(uname -m)"
BINARY_NAME="audius-ctl-${ARCH}"
if [ "$OS" = "Darwin" ]; then
    BINARY_NAME="${BINARY_NAME}-macos"
fi

# Choose the best available pre-build binary
if ! [ -f "bin/$BINARY_NAME" ] && ! [ -f "bin/audius-ctl-native" ]; then
    echo "No build artifact in bin/, Please run 'make' first"
    exit 1
elif ! [ -f "bin/$BINARY_NAME" ] && [ -f "bin/audius-ctl-native" ]; then
    BINARY_NAME="audius-ctl-native"
fi

# choose the best target directory
if [ -w /usr/local/bin ]; then
    TARGET_DIR="/usr/local/bin"
elif echo "$PATH" | grep -q "$HOME/.local/bin"; then
    TARGET_DIR="$HOME/.local/bin"
elif echo "$PATH" | grep -q "$HOME/bin"; then
    TARGET_DIR="$HOME/bin"
else
    echo 'Insufficient permissions and/or no suitable directory found in $PATH'
    echo 'Try `sudo make install` or add $HOME/.local/bin to your $PATH'
    exit 1
fi

# install
cp "bin/$BINARY_NAME" "$TARGET_DIR/audius-ctl"

echo "$BINARY_NAME has been installed to $TARGET_DIR/audius-ctl"
echo "You can run it using: $ audius-ctl"
