#!/bin/bash
set -e

GREEN='\033[0;32m'
NC='\033[0m'


printf "${GREEN}Installing cocoapods...\n${NC}"
{
    # Symlink react-native into the mobile package bc npm doesn't
    # support nohoist
    cd ./node_modules

    source_path=../../../node_modules/react-native
    target_path=react-native
    if [ ! -e "$target_path" ]; then
    ln -s "$source_path" "$target_path"
    fi

    source_path=../../../node_modules/react-native-code-push
    target_path=react-native-code-push
    if [ ! -e "$target_path" ]; then
    ln -s "$source_path" "$target_path"
    fi

    cd ../ios

    if command -v bundle >/dev/null; then
    bundle check || bundle install
    fi
    if command -v pod >/dev/null; then
    pod install
    fi
    cd ..
} > /dev/null