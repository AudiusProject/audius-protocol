import { generateSignature } from '../src/apiSigning'
import { getLibsMock } from './lib/libsMock'
import { loggerFactory } from './lib/reqMock'
import assert from 'assert'
import { PremiumContentAccessError } from '../src/premiumContent/types'
import { getApp } from './lib/app'
import { PremiumContentAccessChecker } from '../src/premiumContent/premiumContentAccessChecker'

const models = require('../src/models')

describe('Test premium content access', function () {
  let premiumContentAccessChecker: PremiumContentAccessChecker

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
  const dummyUserWallet = '0x7c95A677106218A296EcEF1F577c3aE27f0340cd'

  const cid = 'QmcbnrugPPDrRXb5NeYKwPb7HWUj7aN2tXmhgwRfw2pRXo'
  const trackBlockchainId = 1
  const signedDataFromDiscoveryNode = {
    premium_content_id: 1,
    premium_content_type: 'track',
    user_wallet: dummyUserWallet,
    timestamp: Date.now()
  }
  const signedDataFromUser = 'signed-data-from-user'
  const signatureFromUser = 'signature-from-user'

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
    premiumContentAccessChecker = new PremiumContentAccessChecker()
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

  describe('premium content', () => {
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
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        badDNPrivateKey
      )
      const accessWithoutHeaders =
        await premiumContentAccessChecker.checkPremiumContentAccess({
          cid,
          premiumContentHeaders: null as unknown as string,
          libs: libsMock,
          logger: loggerMock,
          redis: redisMock
        })
      assert.deepStrictEqual(accessWithoutHeaders, {
        doesUserHaveAccess: false,
        trackId: 1,
        isPremium: true,
        error: PremiumContentAccessError.MISSING_HEADERS
      })

      const missingPremiumContentHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode,
        signedDataFromUser
      }
      const accessWithMissingHeaders =
        await premiumContentAccessChecker.checkPremiumContentAccess({
          cid,
          premiumContentHeaders: JSON.stringify(
            missingPremiumContentHeadersObj
          ),
          libs: libsMock,
          logger: loggerMock,
          redis: redisMock
        })
      assert.deepStrictEqual(accessWithMissingHeaders, {
        doesUserHaveAccess: false,
        trackId: 1,
        isPremium: true,
        error: PremiumContentAccessError.MISSING_HEADERS
      })
    })

    it('fails when recovered DN wallet is not from registered DN', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        badDNPrivateKey
      )
      const premiumContentHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode,
        signedDataFromUser,
        signatureFromUser
      }
      const access =
        await premiumContentAccessChecker.checkPremiumContentAccess({
          cid,
          premiumContentHeaders: JSON.stringify(premiumContentHeadersObj),
          libs: libsMock,
          logger: loggerMock,
          redis: redisMock
        })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: false,
        trackId: 1,
        isPremium: true,
        error: PremiumContentAccessError.INVALID_DISCOVERY_NODE
      })
    })

    it('passes when everything matches', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        dummyDNPrivateKey
      )
      const premiumContentHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode,
        signedDataFromUser,
        signatureFromUser
      }
      const access =
        await premiumContentAccessChecker.checkPremiumContentAccess({
          cid,
          premiumContentHeaders: JSON.stringify(premiumContentHeadersObj),
          libs: libsMock,
          logger: loggerMock,
          redis: redisMock
        })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: true,
        trackId: 1,
        isPremium: true,
        error: null
      })
    })
  })

  describe('non-premium content', () => {
    it('passes when the CID is missing', async () => {
      const access =
        await premiumContentAccessChecker.checkPremiumContentAccess({
          cid,
          premiumContentHeaders: 'premium-content-headers',
          libs: libsMock,
          logger: loggerMock,
          redis: redisMock
        })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: true,
        trackId: null,
        isPremium: false,
        error: null
      })
    })

    it('passes when there is no track for the cid', async () => {
      const createRecords = async () => {
        const transaction = await models.sequelize.transaction()
        await createCNodeUser(transaction)
        await createClockRecord(transaction)
        await createFile(transaction)
        await transaction.commit()
      }

      const deleteRecords = async () => {
        const transaction = await models.sequelize.transaction()
        await deleteFile(transaction)
        await deleteClockRecord(transaction)
        await deleteCNodeUser(transaction)
        await transaction.commit()
      }

      try {
        await createRecords()
        const access =
          await premiumContentAccessChecker.checkPremiumContentAccess({
            cid,
            premiumContentHeaders: 'premium-content-headers',
            libs: libsMock,
            logger: loggerMock,
            redis: redisMock
          })
        assert.deepStrictEqual(access, {
          doesUserHaveAccess: true,
          trackId: null,
          isPremium: false,
          error: null
        })
        await deleteRecords()
      } catch (e) {
        assert.fail(`Failed to check access: ${(e as Error).message}`)
      }
    })

    it('passes when the track is not premium', async () => {
      const createRecords = async () => {
        const transaction = await models.sequelize.transaction()
        await createCNodeUser(transaction)
        await createClockRecord(transaction)
        await createFile(transaction)
        await createTrack(transaction, false)
        await transaction.commit()
      }

      const deleteRecords = async () => {
        const transaction = await models.sequelize.transaction()
        await deleteTrack(transaction)
        await deleteFile(transaction)
        await deleteClockRecord(transaction)
        await deleteCNodeUser(transaction)
        await transaction.commit()
      }

      try {
        await createRecords()
        const access =
          await premiumContentAccessChecker.checkPremiumContentAccess({
            cid,
            premiumContentHeaders: 'premium-content-headers',
            libs: libsMock,
            logger: loggerMock,
            redis: redisMock
          })
        assert.deepStrictEqual(access, {
          doesUserHaveAccess: true,
          trackId: null,
          isPremium: false,
          error: null
        })
        await deleteRecords()
      } catch (e) {
        assert.fail(`Failed to check access: ${(e as Error).message}`)
      }
    })
  })

  async function createTrack(transaction: any, isPremium = true) {
    await models.Track.create(
      {
        cnodeUserUUID,
        clock: 1,
        blockchainId: trackBlockchainId,
        metadataFileUUID: fileUUID,
        metadataJSON: { is_premium: isPremium }
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
