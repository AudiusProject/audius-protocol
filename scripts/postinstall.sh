#!/bin/bash
set -e

GREEN='\033[0;32m'
NC='\033[0m'


if [[ -z "${CI}" ]]; then
  printf "${GREEN}Updating git hooks...\n${NC}"
  npm run install-hooks > /dev/null
fi

if [[ -z "${CI}" ]]; then
  printf "${GREEN}Updating git secrets...\n${NC}"
  npm run install-git-secrets > /dev/null
fi

printf "${GREEN}Applying patches...\n${NC}"
npm run patch-package > /dev/null


if [[ -z "${CI}" ]]; then
  printf "${GREEN}Setting up audius-compose...\n${NC}"
  ./dev-tools/setup.sh > /dev/null
fi

printf "\n${GREEN}Audius monorepo ready!\n${NC}"
