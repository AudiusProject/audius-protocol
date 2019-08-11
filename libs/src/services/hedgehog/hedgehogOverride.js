// This whole file is temporary - just used to migrate users from pbkdf2 to scrypt

const CryptoJS = require('crypto-js')
const PBKDF2 = require('crypto-js/pbkdf2')

class Utils {
  static WebWorker (worker) {
    if (typeof window !== 'undefined' && window.Worker) {
      const code = worker.toString()
      const blob = new Blob(['(' + code + ')()'])

      return new window.Worker(URL.createObjectURL(blob))
    } else throw new Error('Cannot call web worker on the server')
  }
}

// This function is to do the computation for createKey inside a WebWorker.
// It's saved as a blob on the browser and is imported and called as necessary.
// This means that the API support is limited to what a WebWorker supports, so
// no require statements, no breaking out functions to refactor with multiple
// exports etc.
// exact copy of authWorkerOverride.js
const pbkdf2AuthWorker = function () {
  this.importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js')

  const bufferFromHexString = (hexString) => {
    return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
  }

  const createKey = (password, ivHex) => {
    const cryptoIV = this.CryptoJS.enc.Utf8.parse(ivHex) // cryptoJS expects the iv to be in this special format
    const key = this.CryptoJS.PBKDF2(password, cryptoIV, { keySize: 8, iterations: 50000, hasher: this.CryptoJS.algo.SHA512 })

    // This is the private key
    const keyHex = key.toString(this.CryptoJS.enc.Hex)
    let keyBuffer = bufferFromHexString(keyHex)

    postMessage({ keyHex: keyHex, keyBuffer: keyBuffer })
  }

  this.onmessage = e => {
    if (!e) return
    let d = JSON.parse(e.data)
    createKey(d.password, d.ivHex)
  }
}

async function createKeyPBKDF2 (email, password) {
  let encryptionString = email + ':::' + password
  const ivHex = '0x4f7242b39969c3ac4c6712524d633ce9'
  // if this is browser side, use a web worker to create the key
  // otherwise doing it normally server side
  if (typeof window !== 'undefined' && window && window.Worker) {
    const worker = Utils.WebWorker(pbkdf2AuthWorker.toString())
    worker.postMessage(JSON.stringify({ password: encryptionString, ivHex }))

    return new Promise((resolve, reject) => {
      worker.onmessage = event => {
        let { keyHex } = event.data
        resolve(keyHex)
      }
    })
  } else {
    const cryptoIV = CryptoJS.enc.Utf8.parse(ivHex) // cryptoJS expects the iv to be in this special format
    const key = PBKDF2(encryptionString, cryptoIV, { keySize: 8, iterations: 50000, hasher: CryptoJS.algo.SHA512 })

    // This is the private key
    const keyHex = key.toString(CryptoJS.enc.Hex)

    return keyHex
  }
}

module.exports = { createKeyPBKDF2 }
