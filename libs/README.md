# Audius Javascript SDK

## Table of contents

- [Overview](#overview)
- [Installation](#installation)
  - [In the browser/Vanilla JS](#in-the-browservanilla-js)
  - [In Node.js](#in-nodejs)
  - [Important: include Web3.js](#important-include-web3js)
- [Initialization](#initialization)
  - [In the browser/Vanilla JS](#in-the-browservanilla-js-1)
  - [In Node.js](#in-nodejs-1)

## Overview

The Audius SDK allows you to easily build upon and interact with the Audius network. Currently, we only have a Typescript/Javascript SDK.

We're actively working on building out more SDK features and functionality - stay tuned!

<br />

## Installation

### In the browser/Vanilla JS

To use the Audius SDK in the browser, simply add the following script tag to your HTML pages:

```html
<script src="https://cdn.jsdelivr.net/npm/@audius/sdk@latest/dist/sdk.min.js"></script>
```

The Audius SDK will then be assigned to `window.audiusSdk`.

### In Node.js

Install the SDK package using your preferred JS package manager.

Example:

```bash
npm install @audius/sdk
```

### Important: include Web3.js

In a browser environment, you must install [web3.js](https://github.com/ChainSafe/web3.js) separately and ensure that it is present on the window object at `window.Web3`.

In-browser example:

```html
<!-- Include this BEFORE the Audius SDK script -->
<script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
```

Node.js example:

```js
// Make sure to run `npm install web3`
const Web3 = require('web3')

window.Web3 = Web3
```

## Initialization

To initialize the SDK, simply call the SDK constructor and pass in the name of your app. Note that the constructor is asynchronous.

### In the browser/Vanilla JS

Example code:

```html
<script>
  var sdk
  async function init() {
    // This is how you initialize the SDK:
    sdk = await window.audiusSdk({ appName: '<Name of your app here>' })
  }

  async function doStuff() {
    await init()
    // Now you can call SDK methods, for example:
    const tracks = await sdk.discoveryNode.getTracks()
    console.log('Got tracks!', tracks)
  }

  doStuff()
</script>
```

### In Node.js

Example code:

```js
// audiusSdk.js
import { sdk } from '@audius/sdk'

let audiusSdk = null

const initAudiusSdk = async () => {
  // This is how you initialize the SDK:
  const instance = await sdk({ appName: '<Name of your app here>' })

  // For convenience, you can dispatch an event to broadcast that the SDK is ready
  const event = new CustomEvent('SDK_READY')
  window.dispatchEvent(event)
  audiusSdk = instance
}

// Convenient function to help determine if the SDK is ready
const waitForSdk = () => {
  return new Promise((resolve) => {
    if (audiusSdk) resolve()
    window.addEventListener('SDK_READY', resolve)
  })
}

initAudiusSdk()

export { audiusSdk, waitForSdk }
```

```js
// anotherFile.js
import { audiusSdk, waitForSdk } from './audiusSdk'

const doStuff = async () => {
  await waitForSdk()
  // Now you can call SDK methods, for example:
  const tracks = await audiusSdk.discoveryNode.getTracks()
  console.log('Got tracks!', tracks)
}

doStuff()
```
