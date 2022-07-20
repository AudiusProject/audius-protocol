---
id: "index"
title: "@audius/sdk"
sidebar_label: "Readme"
sidebar_position: 0
custom_edit_url: null
pagination_prev: null
pagination_next: null
---

# Audius JavaScript SDK

## Overview

The Audius SDK allows you to easily build upon and interact with the Audius network. Currently, we only have a Typescript/Javascript SDK.

We're actively working on building out more SDK features and functionality - stay tuned!

## Installation

- [In the browser/Vanilla JS](#in-the-browservanilla-js)
- [In Node.js](#in-nodejs)

### In the browser/Vanilla JS

#### 0. Include Web3.js

```html
<script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
```

#### 1. Include the SDK script tag

```html
<!-- Put this AFTER web3.js -->
<script src="https://cdn.jsdelivr.net/npm/@audius/sdk@latest/dist/sdk.min.js"></script>
```

The Audius SDK will then be assigned to `window.audiusSdk`.

#### 2. Initialize the SDK

```js
const audiusSdk = window.audiusSdk({ appName: 'Name of your app goes here' })
```

#### 3. Make your first API call using the SDK!

```js
const tracks = await audiusSdk.discoveryNode.getTracks()
```

#### Full example

```html title="index.html"
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@audius/sdk@latest/dist/sdk.min.js"></script>
    <script>
      const audiusSdk = window.audiusSdk({
        appName: "My Example App",
      });
      const tracks = await audiusSdk.discoveryNode.getTracks();
      console.log(tracks, "Tracks fetched!");
    </script>
  </head>
  <body>
    <h1>Example content</h1>
  </body>
</html>
```

### In Node.js

#### 0. Install the SDK package using your preferred JS package manager

In your terminal, run:

```bash"
npm install @audius/sdk
```

#### 1. [Skip if not in browser environment] Install web3.js

In your terminal, run:

```bash"
npm install web3
```

#### 2. [Skip if not in browser environment] Assign web3.js to `window.Web3`

```js
import Web3 from 'web3'
window.Web3 = Web3
```

#### 3. Initialize the SDK

```js
import { sdk } from '@audius/sdk'

const audiusSdk = sdk({ appName: 'Name of your app goes here' })
```

#### 4. Make your first API call using the SDK!

```js
const tracks = await audiusSdk.discoveryNode.getTracks()
console.log(tracks, 'Tracks fetched!')
```

#### Full example

```js title="app.js"
import Web3 from 'web3'
import { sdk } from '@audius/sdk'

window.Web3 = Web3
const audiusSdk = sdk({ appName: 'My Example App' })
const tracks = await audiusSdk.discoveryNode.getTracks()
console.log(tracks, 'Tracks fetched!')
```
