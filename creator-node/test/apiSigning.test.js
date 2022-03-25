const assert = require('assert')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const { getLibsMock } = require('./lib/libsMock')

const apiSigning = require('../src/apiSigning')

describe('test apiSigning', function () {
  let libsMock
  beforeEach(async () => {
    libsMock = getLibsMock()
  })

  it('given incomplete timestamp, signature, throw error', async function () {
    try {
      await apiSigning.verifyRequesterIsValidSP({
        audiusLibs: libsMock,
        spID: 1,
        reqTimestamp: undefined,
        reqSignature: undefined
      })
      assert.fail(
        'verifyRequesterIsValidSP should have failed with incomplete timestamp/signaturte'
      )
    } catch (e) {
      assert.ok(
        e.message.includes('Must provide all required query parameters')
      )
    }
  })

  it('given bad spID, throw error', async function () {
    try {
      await apiSigning.verifyRequesterIsValidSP({
        audiusLibs: libsMock,
        spID: undefined,
        reqTimestamp: 'timestamp',
        reqSignature: 'signature'
      })
      assert.fail(
        'verifyRequesterIsValidSP should have failed with incomplete spID'
      )
    } catch (e) {
      assert.ok(
        e.message.includes('Must provide all required query parameters')
      )
    }

    try {
      await apiSigning.verifyRequesterIsValidSP({
        audiusLibs: libsMock,
        spID: -1,
        reqTimestamp: 'timestamp',
        reqSignature: 'signature'
      })
      assert.fail('verifyRequesterIsValidSP should have failed with bad spID')
    } catch (e) {
      assert.ok(e.message.includes('Provided spID is not a valid id'))
    }
  })

  it('if the wallets are zero addressed, throw error', async function () {
    //     blockNumber: 11273786
    // delegateOwnerWallet: "0xc8d0C29B6d540295e8fc8ac72456F2f4D41088c8"
    // endpoint: "https://creatornode.audius.co"
    // owner: "0xe5b256d302ea2f4e04B8F3bfD8695aDe147aB68d"
    // spID: 1
    // type: "content-node"

    try {
      await apiSigning.verifyRequesterIsValidSP({
        audiusLibs: libsMock,
        spID: 100,
        reqTimestamp: 'timestamp',
        reqSignature: 'signature'
      })
      assert.fail(
        'verifyRequesterIsValidSP should have failed with unaddressable spID'
      )
    } catch (e) {
      assert.ok(e.message.includes('not registered as valid SP on L1'))
    }
  })

  // NOTE: cannot test this bc cannot inject mocks in util classes
  // it('if inputs are valid, return proper return values', async function () {
  //   apiSigning.recoverWallet = sinon
  //     .stub()
  //     .returns('0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25')

  //   try {
  //     const resp = await apiSigning.verifyRequesterIsValidSP({
  //       audiusLibs: libsMock,
  //       spID: 1,
  //       reqTimestamp: 'timestamp',
  //       reqSignature: 'signature'
  //     })

  //     assert.ok(
  //       resp.ownerWalletFromSPFactory ===
  //         '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25'
  //     )
  //     assert.ok(resp.spID === 1)
  //     assert.ok(
  //       resp.delegateOwnerWalletFromSPFactory ===
  //         '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25'
  //     )
  //     assert.ok(resp.nodeEndpointFromSPFactory === 'http://mock-cn1.audius.co')
  //   } catch (e) {
  //     console.log(e)
  //     assert.fail('verifyRequesterIsValidSP should not have failed')
  //   }
  // })
})
