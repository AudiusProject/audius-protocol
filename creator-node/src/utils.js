const { recoverPersonalSignature } = require('eth-sig-util')

class Utils {
  static verifySignature (data, signature) {
    return recoverPersonalSignature({ data: data, sig: signature })
  }

  static async timeout (ms) {
    console.log(`starting timeout of ${ms}`)
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = Utils
