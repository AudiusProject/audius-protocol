/* eslint-disable */
// Runs createKey (scrypt) inside a WebWorker. The function is stringified and
// loaded from a Blob, so it must not reference anything outside its own body.
// Copied from @audius/hedgehog 3.0.0-alpha.1 authWorker.js. Changing the scrypt
// implementation or how the inputs are encoded changes every user's key.
export const authWorker = function () {
  const s = self as any

  // Package and deps for https://github.com/ricmoo/scrypt-js
  s.importScripts('https://cdn.jsdelivr.net/npm/scrypt-js@2.0.4/scrypt.min.js')
  s.importScripts(
    'https://cdn.jsdelivr.net/npm/scrypt-js@2.0.4/thirdparty/buffer.min.js'
  )

  const createKey = (encryptStr: string, ivHex: string) => {
    const encryptStrBuffer = s.buffer.SlowBuffer(encryptStr)
    const ivBuffer = s.buffer.SlowBuffer(ivHex)

    const N = 32768
    const r = 8
    const p = 1
    const dkLen = 32

    s.scrypt(
      encryptStrBuffer,
      ivBuffer,
      N,
      r,
      p,
      dkLen,
      function (error: unknown, _progress: unknown, key: unknown) {
        if (error) {
          throw error
        } else if (key) {
          key = new s.buffer.SlowBuffer(key)
          const keyHex = (key as any).toString('hex')
          s.postMessage({ keyHex, keyBuffer: key })
        }
        // no else clause here, the progress triggers the else clause
        // but there's no key yet at that point
      }
    )
  }

  s.onmessage = (e: MessageEvent) => {
    if (!e) return
    const d = JSON.parse(e.data)
    createKey(d.encryptStr, d.ivHex)
  }
}
