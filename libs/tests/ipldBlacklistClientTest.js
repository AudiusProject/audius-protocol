const assert = require('assert')
const helpers = require('./helpers')
const { getDataContractAccounts } = require('../initScripts/helpers/utils')
const Utils = require('../src/utils')
const AudiusLibs = require('../src')
const axios = require('axios')

describe('test ipldBlacklistFactoryClient', () => {
  let audiusLibs
  let blacklisterAddressPublic
  let blacklisterAddressPrivate

  // TODO: use ipfs cli instead OR use js ipfs client
  const trackMultihashDecoded = Utils.decodeMultihash(helpers.constants.trackMetadataCID)
  const trackMultihashDecoded2 = Utils.decodeMultihash(helpers.constants.trackMetadataCID2)
  const trackMultihashDecoded3 = Utils.decodeMultihash(helpers.constants.creatorMetadataCID)

  // 1. generate the dynamic delegate key pairs
  // 2. take one of the pairs and update the blacklisterAddressPublic to the delegate public key generated in contracts-config.json (?)
  // 3. set that delegate public key here, whether by accessing the contracts json file or just propogating it here
  before(async () => {
    // update keys here
    // tear down ganache

    // bring up ganache

    // OR

    // use different hashes

    // OR

    // get new keys from ganache local blockchain
    const ganacheContractsAccounts = await getDataContractAccounts()
    const keyPairs = ganacheContractsAccounts.private_keys
    blacklisterAddressPublic = Object.keys(keyPairs)[0]
    blacklisterAddressPrivate = keyPairs[blacklisterAddressPublic]

    // get contract config
    const contractConfigPath = '../../contracts/contract-config.js'
    const contractConfig = require(contractConfigPath)

    console.log('old contractconfig')
    console.log(contractConfig.development.blacklisterAddress)

    // set contract config blacklisterAddress with new public key
    contractConfig.development.blacklisterAddress = blacklisterAddressPublic

    console.log('updated contractconfig')
    console.log(contractConfig.development.blacklisterAddress)

    // initialize libs with blacklisterAddress
    const libsConfig = await helpers.initializeLibConfig(blacklisterAddressPublic)
    audiusLibs = new AudiusLibs(libsConfig)
    await audiusLibs.init(libsConfig)
  })

  afterEach(async () => {
    // clear ipld bl table

  })

  it('should not index add track event if track metadata CID is in blacklist table', async () => {
    // generate random unique handle
    const handle = 'vicky' + Math.floor(Math.random() * 1000000)

    // add user
    let userTxReceipt = await audiusLibs.contracts.UserFactoryClient.addUser(handle)

    // add ipld blacklist txn with bad CID to chain
    const ipldTxReceipt = await audiusLibs.contracts.IPLDBlacklistFactoryClient.addIPLDToBlacklist(
      trackMultihashDecoded.digest,
      blacklisterAddressPrivate
    )
    console.log('ipld blacklist tx details', ipldTxReceipt)

    // wait 60s for ipld blacklisting to occur (if blacklist happens before track indexing, do not need to wait as indexing will stall)
    console.log('waiting 60s.....')
    await Utils.wait(60 * 1000)

    // add track txn with bad CID as metadata CID to chain
    let { txReceipt, trackId } = await audiusLibs.contracts.TrackFactoryClient.addTrack(
      userTxReceipt.userId,
      trackMultihashDecoded.digest,
      trackMultihashDecoded.hashFn,
      trackMultihashDecoded.size
    )
    console.log('add track tx details', txReceipt, trackId)

    // wait 5s for track indexing to occur
    await Utils.wait(5 * 1000)

    // check that disc prov did not index
    const discProvUrl = 'http://localhost:5000'
    const resp = await axios({
      baseURL: discProvUrl,
      url: '/tracks',
      params: { user_id: userTxReceipt.userId },
      method: 'get'
    })

    assert.deepStrictEqual(resp.data.data.length, 0)
  })

  it('should not index update track event if track metadata CID is in blacklist table', async () => {
    // generate random unique handle
    const handle = 'vicky' + Math.floor(Math.random() * 1000000)

    // add user
    let userTxReceipt = await audiusLibs.contracts.UserFactoryClient.addUser(handle)

    // add trackMultihashDecided2 to ipfs

    // add track txn with CID as metadata CID to chain
    let { txReceipt, trackId } = await audiusLibs.contracts.TrackFactoryClient.addTrack(
      userTxReceipt.userId,
      trackMultihashDecoded2.digest,
      trackMultihashDecoded2.hashFn,
      trackMultihashDecoded2.size
    )
    console.log('add track tx details', txReceipt, trackId)

    // add ipld blacklist txn with bad CID2 to chain
    const ipldTxReceipt = await audiusLibs.contracts.IPLDBlacklistFactoryClient.addIPLDToBlacklist(
      trackMultihashDecoded3.digest,
      blacklisterAddressPrivate
    )
    console.log('ipld blacklist tx details', ipldTxReceipt)

    // update track with bad CID2 to chain
    let track = await audiusLibs.contracts.TrackFactoryClient.updateTrack(
      trackId,
      userTxReceipt.userId,
      trackMultihashDecoded3.digest,
      trackMultihashDecoded3.hashFn,
      trackMultihashDecoded3.size
    )

    // assert that the update didnt go thru by checking that OG details still there
  })
})
