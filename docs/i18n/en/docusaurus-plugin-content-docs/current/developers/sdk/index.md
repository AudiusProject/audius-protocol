---
id: "index"
title: "@audius/sdk"
sidebar_label: "Readme"
sidebar_position: 0
custom_edit_url: null
---

# Audius JavaScript SDK

## Overview

The Audius JavaScript (TypeScript) SDK allows you to easily build on and interact with the Audius protocol.
- ✍️ Log In with Audius
- 🎵 Fetch and stream tracks
- 🔍 Search and display users, tracks, and playlists

👷‍♀️ We're actively working on building out more SDK features and functionality - stay tuned!

## Installation

- [Node.js](#nodejs)
- [HTML + JS](#html--js)

### Node.js

#### 1. Install the SDK package using your preferred JS package manager

In your terminal, run:

```bash"
npm install web3 @audius/sdk
```

#### 2. Initialize the SDK

```js
import { sdk } from '@audius/sdk'

const audiusSdk = sdk({ appName: 'Name of your app goes here' })
```

#### 3. Make your first API call using the SDK!

```js
const track = await audiusSdk.tracks.getTrack({ trackId: 'D7KyD' })
console.log(track, 'Track fetched!')
```

#### Full example

```js title="app.js" showLineNumbers
import Web3 from 'web3'
import { sdk } from '@audius/sdk'

// If running in a browser, set window.Web3
window.Web3 = Web3;

const audiusSdk = sdk({ appName: 'Name of your app goes here' })

const track = await audiusSdk.tracks.getTrack({ trackId: 'D7KyD' })
console.log(track, 'Track fetched!')
```

> If your bundler doesn't automatically polyfill node libraries (like when using create-react-app v5) you will need to use the `web3` script tag instead of the `web3` npm package

### HTML + JS

#### 1. Include the SDK script tag

```html
<script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@audius/sdk@latest/dist/sdk.min.js"></script>
```

The Audius SDK will then be assigned to `window.audiusSdk`.

#### 2. Initialize the SDK

```js
const audiusSdk = window.audiusSdk({ appName: 'Name of your app goes here' })
```

#### 3. Make your first API call using the SDK!

```js
const track = await audiusSdk.tracks.getTrack({ trackId: 'D7KyD' })
```

#### Full example

```html title="index.html" showLineNumbers
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@audius/sdk@latest/dist/sdk.min.js"></script>
    <script>
    	const fn = async () => {
        const audiusSdk = window.audiusSdk({
          appName: "My Example App",
        });
        const track = await audiusSdk.tracks.getTrack({ trackId: 'D7KyD' });
        console.log(track, "Track fetched!");
      }
      fn()
    </script>
  </head>
  <body>
    <h1>Example content</h1>
  </body>
</html>
```
