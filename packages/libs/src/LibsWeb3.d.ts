import BN from 'bn.js'
import Web3Type from 'web3'
declare const Web3: typeof Web3Type & {
  utils: {
    BN: typeof BN
  }
}

export default Web3
