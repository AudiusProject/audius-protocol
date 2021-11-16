// fetch-polyfill.js
import fetch from 'node-fetch'

if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = fetch
}
