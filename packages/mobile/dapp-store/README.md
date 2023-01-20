# Solana Phone Build Tools & Config

This folder contains relevant info for releasing Audius to the Solana Mobile Stack / Saga.

It is important that node 16.13.x is used along with pnpm for the dapp-store cli tooling.

```
nvm install 16.13.2
nvm use 16.13.2
```

## Instructions

Follow cli setup and make sure to get pnpm
https://github.com/solana-mobile/app-publishing-spec/blob/main/packages/cli/README.md

`pnpm install` in this directory

```
cd android
./gradlew assembleRelease

npx dapp-store create release -k <path_to_your_keypair> -b <path_to_your_android_sdk_build_tools> -u https://audius-fe.rpcpool.com

npx dapp-store publish update -k <path_to_your_keypair> -u https://audius-fe.rpcpool.com --requestor-is-authorized --complies-with-solana-dapp-store-policies
```


