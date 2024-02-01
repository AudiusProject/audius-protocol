#! /bin/bash
# Exposes scripts to web workers by publishing them to the public folder.

PUBLISH_DESTINATION="./public/scripts"

# Build necessary minified/browserable js.
make -C "../../node_modules/exif-parser" build-browser-bundle

declare -a modules=(
  "./node_modules/jimp/browser/lib/jimp.min.js"
  "./node_modules/exif-parser/dist/exif-parser-0.1.12-min.js"
  "./node_modules/web3/dist/web3.min.js"
  "./node_modules/web3/dist/web3.min.js.map"
)

mkdir -p "$PUBLISH_DESTINATION"
for script in "${modules[@]}"; do
  echo "published $script"
  cp -a "$script" "$PUBLISH_DESTINATION"
done
