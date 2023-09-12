/* eslint-disable @typescript-eslint/no-var-requires */

let XMLHttpRequestRef: typeof window.XMLHttpRequest

if (typeof window === 'undefined' || window === null) {
  XMLHttpRequestRef = require('xmlhttprequest').XMLHttpRequest
} else {
  XMLHttpRequestRef = window.XMLHttpRequest
}

export { XMLHttpRequestRef as XMLHttpRequest }
