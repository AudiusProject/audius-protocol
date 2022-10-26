import Web3Type from 'web3'
import BN from 'bn.js'
declare const Web3: typeof Web3Type & {
  utils: {
    BN: typeof BN
  }
}

export default Web3
