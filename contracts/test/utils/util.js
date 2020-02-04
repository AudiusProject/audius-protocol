
import * as bs58 from 'bs58'
import * as util from 'util'
import { web3New } from './web3New'

/** hex to utf8
  * @param {string} arg - Raw hex-encoded string returned from contract code
  * @returns {string} utf8 converted string value
  */
export const toStr = (arg) => {
  return web3New.utils.hexToUtf8(arg)
}

export const eth_signTypedData = (userAddress, signatureData) => {
  return new Promise(function (resolve, reject) {
    // fix per https://github.com/ethereum/web3.js/issues/1119
    // truffle uses an outdated version of web3
    web3New.providers.HttpProvider.prototype.sendAsync = web3New.providers.HttpProvider.prototype.send
    web3New.currentProvider.sendAsync({
      method: 'eth_signTypedData',
      params: [userAddress, signatureData],
      from: userAddress
    }, function (err, result) {
      if (err) {
        reject(err)
      } else if (result.error) {
        reject(result.error)
      } else {
        resolve(result.result)
      }
    })
  })
}

/** Customizable console.log wrapper */
export const deepLog = (msg, val, depth = null, showHidden = false) => {
  console.log('\n-- ' + msg + ' --\n', util.inspect(val, { colors: true, depth: depth, showHidden: showHidden }), '\n')
}

/** Returns decoded multihash with digest, hash function, and digest size
 *  IPFS Uses alphanumeric base58 encoded 46byte hash which cannot be stored by default in solidity bytes32 field
 *  https://github.com/multiformats/multihash + https://github.com/saurfang/ipfs-multihash-on-solidity
 *  @param {string} - encoded multihash - 46byte long base58-encoded string
 *  @returns {object} with:
 *    digest - 32byte long hex string
 *    hashFn - 1byte int indicating hash function used
 *    size - 1byte int indicating size of digest
 */
export const decodeMultihash = (multihash) => {
  let base16multihash = bs58.decode(multihash)
  return {
    digest: `0x${base16multihash.slice(2).toString('hex')}`,
    hashFn: base16multihash[0],
    size: base16multihash[1]
  }
}

/** Returns encoded multihash given component object
 *  @param {string, string, string} - digest, hash function, size
 *  @returns {string} - base58-encoded 46byte string
 */
export const encodeMultihash = (digest, hashFn, size) => {
  let hashBytes = Buffer.from(digest.slice(2), 'hex')
  let multiHashBytes = Buffer.from(new ArrayBuffer(2 + hashBytes.length))
  multiHashBytes[0] = hashFn
  multiHashBytes[1] = size
  multiHashBytes.set(hashBytes, 2)
  return bs58.encode(multiHashBytes)
}
