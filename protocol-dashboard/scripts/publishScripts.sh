#! /bin/bash
# Exposes scripts to client browser and web workers by publishing them to the public folder.

PUBLISH_DESTINATION="./public/scripts"

declare -a modules=(
  "./node_modules/web3/dist/web3.min.js"
)

mkdir -p "$PUBLISH_DESTINATION"
for script in "${modules[@]}"
do
  echo "published $script"
  cp "$script" "$PUBLISH_DESTINATION"
done
