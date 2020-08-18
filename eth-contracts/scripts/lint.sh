#!/usr/bin/env bash
set -e
set -o pipefail


<<COMMENT
Lint all files in the audius_contracts repository
COMMENT

printline() {
  printf '\n%40s\n' | tr ' ' -
}

npm run truffle-compile

printline
printf 'START Standard Lint'
npm run lint ./
printf '\nEND Standard Lint'
printline
printf 'START Solium lint'
npm run solidity-lint
printf '\nEND Solium lint'
printline


