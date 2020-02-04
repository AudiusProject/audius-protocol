/* global web3 */
/** ensures use of pre-configured web3 if provided */

export let web3New
if (typeof web3 === 'undefined') {
  web3New = require('web3')
} else {
  web3New = web3
}
