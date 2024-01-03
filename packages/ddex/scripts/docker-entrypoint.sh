#!/bin/sh

# Directory where build artifacts are stored in the image before being copied to the volume
TEMP_BUILD_DIR="/tmp/dist"

# Directory mounted as a volume
VOLUME_DIR="/app/dist"

# Calculate the current checksum of the temporary build directory
CHECKSUM_FILE="$VOLUME_DIR/.checksum"
current_checksum=$(find "$TEMP_BUILD_DIR" -type f -exec md5sum {} \; | md5sum | cut -d' ' -f1)

# Read the last checksum (if it exists)
last_checksum=""
if [ -f "$CHECKSUM_FILE" ]; then
    last_checksum=$(cat "$CHECKSUM_FILE")
fi

# Compare checksums and copy if different
if [ "$current_checksum" != "$last_checksum" ]; then
    echo "Changes detected. Updating files in volume..."
    cp -r $TEMP_BUILD_DIR/* $VOLUME_DIR/
    echo "$current_checksum" > "$CHECKSUM_FILE"
    echo "Volume updated."
else
    echo "No changes detected. No update needed."
fi

# Keep the container running by tailing /dev/null
tail -f /dev/null
