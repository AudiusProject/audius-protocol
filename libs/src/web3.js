let Web3
if (window && window.Web3) {
  Web3 = window.Web3
} else {
  Web3 = require('web3')
}

module.exports = Web3