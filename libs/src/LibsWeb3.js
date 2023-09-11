let Web3
if (typeof window !== 'undefined' && window && window.Web3) {
  Web3 = window.Web3
} else {
  Web3 = await import('web3')
}

module.exports = Web3
