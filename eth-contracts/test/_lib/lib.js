/** ensures use of pre-configured web3 if provided */
let web3New
if (typeof web3 === 'undefined') {
  web3New = require('web3')
} else {
  web3New = web3
}

export const testContractKey = web3New.utils.utf8ToHex('TestContract')

/** Constant string values */
export const strings = {
  first: web3New.utils.utf8ToHex('first'),
  second: web3New.utils.utf8ToHex('second'),
  third: web3New.utils.utf8ToHex('third'),
  test: web3New.utils.utf8ToHex('test')
}

/** hex to utf8
 * @param {string} arg - Raw hex-encoded string returned from contract code
 * @returns {string} utf8 converted string value
 */
 export const toStr = (arg) => {
  return web3New.utils.hexToUtf8(arg)
}

/** TODO - change all duplicate func declarations to reference this */
export const getLatestBlock = async (web3) => {
  return web3.eth.getBlock('latest')
}

/** Returns formatted transaction receipt object with event and arg info
 * @param {object} txReceipt - transaction receipt object
 * @returns {object} w/event + args array from txReceipt
 */
export const parseTx = (txReceipt, multipleEvents = false) => {
  if (!txReceipt.logs.length >= 1) {
    throw new Error('Invalid txReceipt length')
  }
  
  if (multipleEvents) {
    let resp = []
    for (const log of txReceipt.logs) {
      if (!log.hasOwnProperty('event')) {
        throw new Error('Missing event log in tx receipt')
      }
      resp.push({
        'event': {
          'name': log.event,
          'args': log.args
        }
      })
    }
    return resp
  } else {
    if (!(txReceipt.logs[0].hasOwnProperty('event'))) {
      throw new Error('Missing event log in tx receipt')
    }
  
    return {
      'event': {
        'name': txReceipt.logs[0].event,
        'args': txReceipt.logs[0].args
      }
    }
  }
}

/**  */
export const assertThrows = async (blockOrPromise, expectedErrorCode, expectedReason) => {
  try {
    (typeof blockOrPromise === 'function') ? await blockOrPromise() : await blockOrPromise
  } catch (error) {
    assert(error.message.search(expectedErrorCode) > -1, `Expected error code "${expectedErrorCode}" but failed with "${error}" instead.`)
    return error
  }
  // assert.fail() for some reason does not have its error string printed 🤷
  assert(false, `Expected "${expectedErrorCode}"${expectedReason ? ` (with reason: "${expectedReason}")` : ''} but it did not fail`)
}

/**  */
export const assertRevert = async (blockOrPromise, expectedReason) => {
  const error = await assertThrows(blockOrPromise, 'revert', expectedReason)
  if (!expectedReason) {
    return
  }
  const expectedMsgFound = error.message.indexOf(expectedReason) >= 0
  assert.isTrue(expectedMsgFound, `Expected revert reason not found. Expected '${expectedReason}'. Found '${error.message}'`)
}

/**  */
export const advanceBlock = (web3) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      const newBlockHash = web3.eth.getBlock('latest').hash

      return resolve(newBlockHash)
    })
  })
}
