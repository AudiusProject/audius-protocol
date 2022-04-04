/* global assert */
/****** TX RECEIPT PARSERS ******/

/** Returns formatted transaction receipt object with event and arg info
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} w/event + args array from txReceipt
  */
export const parseTx = (txReceipt) => {
  if (!txReceipt.logs.length >= 1) {
    throw new Error('Invalid txReceipt length')
  }
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

/**
 * Parses through tx receipt and asserts its validity of each key-value pair
 * @param {object} txReceipt - Transaction receipt object
 * @param {string} name - Name of event
 * @param {object} properties - Object that contains keys to parse and check validity of
 * @returns {object} event with args from tx receipt
 */
export const parseTxWithAssertsAndResp = (txReceipt, name, properties) => {
  const tx = parseTx(txReceipt)
  checkPropertiesExist(tx, properties)
  assertEqualValues(tx, name, properties)
  return buildReturnObj(tx, properties)
}

export const parseTxWithResp = (txReceipt, properties) => {
  const tx = parseTx(txReceipt)
  checkPropertiesExist(tx, properties)
  return buildReturnObj(tx, properties)
}

// Dynamically check if properties exist in tx
const checkPropertiesExist = (tx, properties) => {
  if (!tx.event.hasOwnProperty('args')) {
    throw new Error('Missing args property')
  }
  for (var p in properties) {
    if (!tx.event.args.hasOwnProperty(p)) {
      throw new Error('Missing ' + p)
    }
  }
}

// Asserts that the tx key-value matches the expected values
// TODO check for the properties emittedTrackIds, _addedTrackId (potentially more)
export const assertEqualValues = (tx, name, properties) => {
  if (name) {
    assert.equal(tx.event.name, name, 'Expected same event name')
  }
  for (var p in properties) {
    switch (p) {
      case '_id':
      case '_userId':
      case '_trackOwnerId':
      case '_trackId':
      case '_playlistId':
      case '_followeeUserId':
      case '_primaryId':
        assert.equal(tx.event.args[p].toNumber(), properties[p], 'Expected same ' + p)
        break
      case '_secondaryIds':
        let secondariesFromChain = tx.event.args[p]
        let secondaries = properties[p]
        assert.isTrue(
          secondariesFromChain.every((replicaId, i) => replicaId.eq(secondaries[i])),
          'Secondary mismatch'
        )
        break
      default:
        assert.equal(tx.event.args[p], properties[p], 'Expected same ' + p)
        break
    }
  }
}

// Builds the event response with keys from tx receipt
const buildReturnObj = (tx, properties) => {
  let returnObj = {}
  returnObj['eventName'] = tx.event.name
  for (var p in properties) {
    switch (p) {
      case '_id':
        returnObj['trackId'] = tx.event.args[p].toNumber()
        break
      case '_userId':
      case '_trackOwnerId':
      case '_trackId':
      case '_playlistId':
      case '_followeeUserId':
        // Slices the property starting at index 1 to remove _
        returnObj[p.slice(1, p.length)] = tx.event.args[p].toNumber()
        break
      default:
        returnObj[p.slice(1, p.length)] = tx.event.args[p]
        break
    }
  }
  return returnObj
}

/** Returns formatted event params from DiscoveryProvider.register() transaction receipt
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} with eventName, discprovId, discprovWallet, discprovEndpoint
  */
export const parseDiscprovRegisterTx = (tx) => {
  tx = parseTx(tx)
  checkPropertiesExist(tx, { _id: true, _wallet: true, _endpoint: true })
  return {
    'eventName': tx.event.name,
    'discprovId': tx.event.args._id.toNumber(),
    'discprovWallet': tx.event.args._wallet,
    'discprovEndpoint': tx.event.args._endpoint
  }
}
  