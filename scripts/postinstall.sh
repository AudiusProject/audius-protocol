#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'


if [[ -z "${CI}" ]]; then
  printf "${GREEN}Updating git hooks...\n${NC}"
  npm run install-hooks > /dev/null
fi

if [[ -z "${CI}" ]]; then
  printf "${GREEN}Updating git secrets...\n${NC}"
  npm run install-git-secrets > /dev/null
fi

printf "${GREEN}Setting up initial package links...\n${NC}"
{
  # First ensure react-native exists in root node_modules for patch-package
  if [ ! -e "node_modules/react-native" ]; then
    printf "${GREEN}Moving react-native to root node_modules...\n${NC}"
    cp -R ./packages/mobile/node_modules/react-native ./node_modules/
    rm -rf ./packages/mobile/node_modules/react-native
  fi

  cd ./packages/mobile/node_modules

  # Link react-native-code-push from root since it's not in mobile/node_modules
  source_path=../../../node_modules/react-native-code-push
  target_path=react-native-code-push
  if [ ! -e "$target_path" ]; then
    ln -s "$source_path" "$target_path"
  fi

  cd ../../..
} > /dev/null

printf "${GREEN}Applying patches...\n${NC}"
npm run patch-package > /dev/null

printf "${GREEN}Moving react-native back to mobile...\n${NC}"
{
  # Move react-native back to mobile/node_modules for pod install
  if [ -e "node_modules/react-native" ]; then
    rm -rf ./packages/mobile/node_modules/react-native
    mv ./node_modules/react-native ./packages/mobile/node_modules/
    # Create symlink back to root
    cd node_modules
    source_path=../packages/mobile/node_modules/react-native
    target_path=react-native
    if [ ! -e "$target_path" ]; then
      ln -s "$source_path" "$target_path"
    fi
    cd ..
  fi
} > /dev/null

# xcodebuild may exist (e.g. if xcode-select is installed via homebrew) but won't work alone
if [[ -z "${SKIP_POD_INSTALL}" ]]; then
  if ! xcodebuild --help &>/dev/null; then
    printf "${YELLOW}WARNING: Xcode not installed. Skipping mobile dependency installation.${NC}\n"
    SKIP_POD_INSTALL=true
  fi
fi

if [[ -z "${SKIP_POD_INSTALL}" ]]; then
  printf "${GREEN}Installing cocoapods...\n${NC}"
  {
    cd ./packages/mobile/ios

    if command -v bundle >/dev/null; then
      bundle check || bundle install
    fi
    if command -v pod >/dev/null; then
      RCT_NEW_ARCH_ENABLED=0 bundle exec pod install
    fi
    cd ../../..
  } > /dev/null
fi

if [[ -z "${CI}" ]]; then
  printf "${GREEN}Setting up audius-compose...\n${NC}"
  ./dev-tools/setup.sh > /dev/null
fi

if [[ -z "${CI}" ]]; then
  printf "${GREEN}Installing discovery provider dependencies...\n${NC}"
  pip install -r packages/discovery-provider/requirements.txt > /dev/null
fi

printf "\n${GREEN}Audius monorepo ready!\n${NC}"
