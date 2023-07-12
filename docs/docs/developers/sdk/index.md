---
id: "index"
title: "@audius/sdk"
sidebar_label: "Getting Started"
sidebar_position: 0
custom_edit_url: null
---

# Getting Started with the Audius SDK

## Overview

The Audius JavaScript (TypeScript) SDK allows you to easily interact with the Audius protocol. Use the SDK to:

- 🎵 Stream and upload tracks
- 🔍 Search and display users, tracks, and playlists
- ✍️ Allow your users to [log in with their Audius account](/developers/log-in-with-audius)

...and much more!

## Set Up Your Developer App

1. [Create an Audius account](https://audius.co/signup) if you do not have one already.

2. Head to the [Settings page](https://audius.co/settings) and select "Manage Your Apps." Follow the prompts to create a new developer app and get your Audius API Key and API Secret.

:::tip

Make sure you save your API Secret somewhere safe — treat it like a password.

:::

## Install the SDK

- [Node.js](#nodejs)
- [HTML + JS](#html--js)

### Node.js

If your project is in a Node.js environment, run this in your terminal:

```bash
npm install web3 @audius/sdk
```

### HTML + JS

Otherwise, include the SDK script tag in your web page. The Audius SDK will then be assigned to `window.audiusSdk`.

```html
<script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@audius/sdk@latest/dist/sdk.min.js"></script>
```

## Initialize the SDK

Initialize the SDK with your API key.

If you plan to write data to Audius (e.g. upload a track, favorite a playlist, etc.), then pass in your API secret as well.

### Node.js example

```js title="In Node.js environment"
import { sdk } from "@audius/sdk";

// If client-side, do NOT include the API secret:
const audiusSdk = sdk({ apiKey: "Your API Key goes here" });

// If server-side, include the API secret if you plan to write data using the SDK – e.g. upload a track, favorite a playlist, etc.
const audiusSdk = sdk({
  apiKey: "Your API Key goes here",
  apiSecret: "Your API Secret goes here",
});
```

### HTML + JS example

```js title="In web page"
const audiusSdk = window.audiusSdk({ apiKey: "Your API key goes here" });
```

:::warning

Do NOT include your API secret if you are running the SDK on the client side, as this will expose your secret.

:::

## Make your first API call using the SDK!

Once you have the initialized SDK instance, it's smooth sailing to making your first API calls.

:::note

If you included your API secret in the previous step, you'll be able do both reads (e.g. fetching a playlist) and writes (e.g. reposting a playlist) to Audius. Otherwise, you'll be able to read data only.

:::

```js
// Fetch your first track!
const track = await audiusSdk.tracks.getTrack({ trackId: "D7KyD" });
console.log(track, "Track fetched!");

// If you initialized the SDK with your API secret, you can write data as well.
// For example, to favorite the track above:
const userId = (
  await audiusSdk.users.getUserByHandle({
    handle: "Your Audius handle goes here",
  })
).data?.id;
const track = await audiusSdk.tracks.saveTrack({
  trackId: "D7KyD",
  userId,
});
```

## Full Node.js example

```js title="app.js" showLineNumbers
import Web3 from "web3";
import { sdk } from "@audius/sdk";

// If running in a browser, set window.Web3
window.Web3 = Web3;

const audiusSdk = sdk({
  apiKey: "Your API Key goes here",
  apiSecret: "Your API Secret goes here", // EXCLUDE this if running client-side
});

const track = await audiusSdk.tracks.getTrack({ trackId: "D7KyD" });
console.log(track, "Track fetched!");

const userId = (
  await audiusSdk.users.getUserByHandle({
    handle: "Your Audius handle goes here",
  })
).data?.id;

// Only possible if `apiSecret` is passed into `sdk` above:
const track = await audiusSdk.tracks.saveTrack({
  trackId: "D7KyD",
  userId,
});
console.log("Track favorited!");
```

:::note

If your bundler doesn't automatically polyfill node libraries (like when using create-react-app v5) you will need to use the `web3` script tag instead of the `web3` npm package

:::

## Full HTML + JS example

```html title="index.html" showLineNumbers
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@audius/sdk@latest/dist/sdk.min.js"></script>
    <script>
      const fn = async () => {
        const audiusSdk = window.audiusSdk({
          apiKey: "Your API Key goes here",
        });
        const track = await audiusSdk.tracks.getTrack({ trackId: "D7KyD" });
        console.log(track, "Track fetched!");
      };

      fn();
    </script>
  </head>
  <body>
    <h1>Example content</h1>
  </body>
</html>
```

## What's next?

- [Get authorization](/developers/log-in-with-audius) to access your app's users' Audius accounts

- [Explore the API docs](/developers/sdk/classes/TracksApi) to see what else you can do with the Audius SDK
