const assert = require('assert')
let helpers = require('./helpers')

let audiusInstance = helpers.audiusInstance

before(async function () {
  await audiusInstance.init()
})

it('should verify signature', async function () {
  const address = await audiusInstance.web3Manager.verifySignature(helpers.constants.signatureData, helpers.constants.signature)
  assert.strictEqual(address, helpers.constants.signatureAddress)
})

it('should detect malformed signature', async function () {
  const malformedData = helpers.constants.signatureData.replace('1', '2')
  const address = await audiusInstance.web3Manager.verifySignature(malformedData, helpers.constants.signature)
  assert.notStrictEqual(address, helpers.constants.signatureAddress)
})
