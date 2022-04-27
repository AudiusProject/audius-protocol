const assert = require('assert')

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
        'verifyRequesterIsValidSP should have failed with incomplete timestamp/signature'
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
        reqTimestamp: '022-03-25T15:02:35.573Z',
        reqSignature:
          '0xd1d5c2957a22f644c03c608ebd5c1af940e6525892b3d65cf31b1122ec1354a70bf8f863120688639e2dcf7df1e58af3e6fc5ecf6c722f09f83d0f3d56dfa9e01c"'
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
        reqTimestamp: '022-03-25T15:02:35.573Z',
        reqSignature:
          '0xd1d5c2957a22f644c03c608ebd5c1af940e6525892b3d65cf31b1122ec1354a70bf8f863120688639e2dcf7df1e58af3e6fc5ecf6c722f09f83d0f3d56dfa9e01c"'
      })
      assert.fail('verifyRequesterIsValidSP should have failed with bad spID')
    } catch (e) {
      assert.ok(e.message.includes('Provided spID is not a valid id'))
    }
  })

  it('if the wallets are zero addressed, throw error', async function () {
    try {
      await apiSigning.verifyRequesterIsValidSP({
        audiusLibs: libsMock,
        spID: 100,
        reqTimestamp: '022-03-25T15:02:35.573Z',
        reqSignature:
          '0xd1d5c2957a22f644c03c608ebd5c1af940e6525892b3d65cf31b1122ec1354a70bf8f863120688639e2dcf7df1e58af3e6fc5ecf6c722f09f83d0f3d56dfa9e01c"'
      })
      assert.fail(
        'verifyRequesterIsValidSP should have failed with unaddressable spID'
      )
    } catch (e) {
      assert.ok(e.message.includes('not registered as valid SP on L1'))
    }
  })

  it('if the api signing is mismatched, throw error', async function () {
    try {
      await apiSigning.verifyRequesterIsValidSP({
        audiusLibs: libsMock,
        spID: 1,
        reqTimestamp: '022-03-25T15:02:35.573Z',
        reqSignature:
          '0xd1d5c2957a22f644c03c608ebd5c1af940e6525892b3d65cf31b1122ec1354a70bf8f863120688639e2dcf7df1e58af3e6fc5ecf6c722f09f83d0f3d56dfa9e01c"'
      })
      assert.fail(
        'verifyRequesterIsValidSP should have failed with unaddressable spID'
      )
    } catch (e) {
      assert.ok(
        e.message.includes(
          'Request for signature must be signed by delegate owner wallet registered on L1 for spID'
        )
      )
    }
  })

  it('if inputs are valid, return proper return values', async function () {
    try {
      const resp = await apiSigning.verifyRequesterIsValidSP({
        audiusLibs: libsMock,
        spID: 1,
        reqTimestamp: '2022-03-25T15:22:54.866Z',
        reqSignature:
          '0xc66fd190c8be82f1827088becfc4dceb8682b9d591f6dc67381b4988cb58c37c4a5c99e1563b127ccdb33a2fd43de8c75669f8d48d493477adad3a0a316356941c'
      })

      assert.ok(
        resp.ownerWalletFromSPFactory ===
          '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25'
      )
      assert.ok(resp.spID === 1)
      assert.ok(
        resp.delegateOwnerWalletFromSPFactory ===
          '0x1ec723075e67a1a2b6969dc5cff0c6793cb36d25'
      )
      assert.ok(resp.nodeEndpointFromSPFactory === 'http://mock-cn1.audius.co')
    } catch (e) {
      console.log(e)
      assert.fail('verifyRequesterIsValidSP should not have failed')
    }
  })
})
