<p align="center">
  <br/>
  <a target="_blank" href="https://audius.co">
    <img src="https://user-images.githubusercontent.com/2731362/90302695-e5ae8a00-de5c-11ea-88b5-24c1408affc6.png" alt="audius-client" width="200">
  </a>
  <br/>

  <p align="center">
    The Audius Client Monorepo
    <br/>
    🎧🎸🎹🤘🎶🥁🎷🎻🎤🔊
  </p>
</p>

<br/>
<br/>

[![CircleCI](https://circleci.com/gh/AudiusProject/audius-client.svg?style=svg)](https://circleci.com/gh/AudiusProject/audius-client)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Packages

| Name                                                      | Description                            |
| --------------------------------------------------------- | -------------------------------------- |
| [`web`](./packages/web)                                   | The Audius web and desktop application |
| [`mobile`](./packages/mobile)                             | The Audius mobile application          |
| [`stems`](./packages/stems)                               | The Audius client component library    |
| [`common`](./packages/common)                             | Shared code between web and mobile     |
| [`eslint-config-audius`](./packages/eslint-config-audius) | Shared lint configuration              |

### Required Dependencies

The following dependencies are required to run the Audius client:

```
node python ruby
```

`npm install` will fail if they are not met. We recommend [homebrew](https://brew.sh/), [pyenv](https://github.com/pyenv/pyenv), and [rbenv](https://github.com/rbenv/rbenv). Don't forget to follow the instructions in the install command output (eg. adding things to your `.zshrc` or `bashrc` file).

```
brew install nvm pyenv rbenv

nvm install
pyenv install
rbenv install
```

### Getting Started

After cloning run:

```bash
npm install
```

This will do the following:

- Check you have the correct versions of node, ruby, and python
- Install root dependencies
- Install all package dependencies
- Initialize git hooks (`npx @escape.tech/mookme init --only-hook --skip-types-selection`)
- Install ios pods

### Running A Client

Environments:

- \*:dev runs against local services
- \*:stage runs against the staging testnet
- \*:prod runs against production infrastructure

```bash
# web
npm run web:dev
npm run web:stage
npm run web:prod

# desktop
npm run desktop:dev
npm run desktop:stage
npm run desktop:prod

# mobile

# ios
npm run ios:dev
npm run ios:stage
npm run ios:prod
# on a physical device
xcrun xctrace list devices
npm run ios:<env> -- --device "My iPhone"

# android
npm run android:dev
npm run android:stage
npm run android:prod
# on a physical device
adb devices
npm run android:<env> -- --device "A38M608KHBK"

# stems in watch mode
npm run stems

# common in watch mode
npm run common

# lint and typecheck
npm run verify
```

### Linking the audius sdk

To develop with the Audius [sdk](https://github.com/AudiusProject/audius-protocol/tree/main/libs) alongside the client, clone the audius-protocol repository and run the following:

```bash
cd audius-protocol
export PROTOCOL_DIR=$(pwd)
```

```bash
cd audius-client
npm run sdk:link
npm run web:stage # or similar
```
