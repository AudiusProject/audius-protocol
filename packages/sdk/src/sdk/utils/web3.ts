import type Web3Type from 'web3'

declare global {
  interface Window {
    // @ts-ignore
    Web3: Web3
  }
}

type Web3 = typeof Web3Type

let web3: Web3
if (typeof window !== 'undefined' && window && window.Web3) {
  web3 = window.Web3
} else {
  web3 = require('web3')
}

export default web3
