import { generateSignature } from '../src/apiSigning'
import { getLibsMock } from './lib/libsMock'
import { loggerFactory } from './lib/reqMock'
import assert from 'assert'
import { getApp } from './lib/app'
import { checkContentAccess } from '../src/contentAccess/contentAccessChecker'

const models = require('../src/models')

describe('Test content access', function () {
  let server: any
  let libsMock: any
  let redisMock: any
  let loggerMock: any

  const dummyDNPrivateKey =
    '0x3873ed01bfb13621f9301487cc61326580614a5b99f3c33cf39c6f9da3a19cad'
  const badDNPrivateKey =
    '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  const dummyDNDelegateOwnerWallet =
    '0x1D9c77BcfBfa66D37390BF2335f0140979a6122B'

  const cid = 'QmcbnrugPPDrRXb5NeYKwPb7HWUj7aN2tXmhgwRfw2pRXo'
  const trackBlockchainId = 1
  const signedDataFromDiscoveryNode = {
    cid: cid,
    timestamp: Date.now()
  }
  const cnodeUserUUID = '2103c344-3843-11ed-a261-0242ac120002'
  const fileUUID = 'f536b83e-3842-11ed-a261-0242ac120002'

  before(async () => {
    libsMock = getLibsMock()
    const app = await getApp(libsMock)
    server = app.server
  })

  after(async () => {
    await server.close()
  })

  beforeEach(() => {
    redisMock = new Map()
    redisMock.set(
      'all_registered_dnodes',
      JSON.stringify([
        {
          delegateOwnerWallet: dummyDNDelegateOwnerWallet,
          type: 'discovery-node'
        }
      ])
    )
    loggerMock = loggerFactory()
  })

  describe('content access', () => {
    beforeEach(async () => {
      const transaction = await models.sequelize.transaction()
      await createCNodeUser(transaction)
      await createClockRecord(transaction)
      await createFile(transaction)
      await createTrack(transaction)
      await transaction.commit()
    })

    afterEach(async () => {
      const transaction = await models.sequelize.transaction()
      await deleteTrack(transaction)
      await deleteFile(transaction)
      await deleteClockRecord(transaction)
      await deleteCNodeUser(transaction)
      await transaction.commit()
    })

    it('fails when there are missing headers', async () => {
      const accessWithoutHeaders = await checkContentAccess({
        cid,
        contentAccessHeaders: null as unknown as string,
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(accessWithoutHeaders, {
        doesUserHaveAccess: false,
        error: 'MissingHeaders'
      })

      const accessWithMissingHeaders = await checkContentAccess({
        cid,
        contentAccessHeaders: JSON.stringify({}),
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(accessWithMissingHeaders, {
        doesUserHaveAccess: false,
        error: 'MissingHeaders'
      })
    })

    it('fails when recovered DN wallet is not from registered DN', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        badDNPrivateKey
      )
      const contentAccessHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode
      }
      const access = await checkContentAccess({
        cid,
        contentAccessHeaders: JSON.stringify(contentAccessHeadersObj),
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: false,
        error: 'InvalidDiscoveryNode'
      })
    })

    it('passes when everything matches', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        dummyDNPrivateKey
      )
      const contentAccessHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode
      }
      const access = await checkContentAccess({
        cid,
        contentAccessHeaders: JSON.stringify(contentAccessHeadersObj),
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: true,
        error: null
      })
    })
  })

  async function createTrack(transaction: any) {
    await models.Track.create(
      {
        cnodeUserUUID,
        clock: 1,
        blockchainId: trackBlockchainId,
        metadataFileUUID: fileUUID,
        metadataJSON: {}
      },
      { transaction }
    )
  }

  async function deleteTrack(transaction: any) {
    await models.Track.destroy(
      {
        where: { blockchainId: trackBlockchainId }
      },
      { transaction }
    )
  }

  async function createFile(transaction: any) {
    await models.File.create(
      {
        fileUUID,
        cnodeUserUUID,
        multihash: cid,
        storagePath: 'storagePath',
        trackBlockchainId,
        type: 'track',
        clock: 1
      },
      { transaction }
    )
  }

  async function deleteFile(transaction: any) {
    await models.File.destroy(
      {
        where: { multihash: cid }
      },
      { transaction }
    )
  }

  async function createClockRecord(transaction: any) {
    await models.ClockRecord.create(
      {
        cnodeUserUUID,
        clock: 1,
        sourceTable: 'File'
      },
      { transaction }
    )
  }

  async function deleteClockRecord(transaction: any) {
    await models.ClockRecord.destroy(
      {
        where: { cnodeUserUUID }
      },
      { transaction }
    )
  }

  async function createCNodeUser(transaction: any) {
    await models.CNodeUser.create(
      {
        cnodeUserUUID,
        walletPublicKey: 'wallet-public-key',
        clock: 1
      },
      { transaction }
    )
  }

  async function deleteCNodeUser(transaction: any) {
    await models.CNodeUser.destroy(
      {
        where: { cnodeUserUUID }
      },
      { transaction }
    )
  }
})
