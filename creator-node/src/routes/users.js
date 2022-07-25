const express = require('express')
const ethereumUtils = require('ethereumjs-util')
const crypto = require('crypto')
const base64url = require('base64-url')
const { promisify } = require('util')
const randomBytes = promisify(crypto.randomBytes)
const _ = require('lodash')

const config = require('../config')
const models = require('../models')
const sequelize = models.sequelize
const { authMiddleware, ensureStorageMiddleware } = require('../middlewares')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest
} = require('../apiHelpers')
const sessionManager = require('../sessionManager')
const utils = require('../utils')
const DBManager = require('../dbManager.js')

const CHALLENGE_VALUE_LENGTH = 20
const CHALLENGE_TTL_SECONDS = 120
const CHALLENGE_PREFIX = 'userLoginChallenge:'

const router = express.Router()

/**
 * Creates CNodeUser table entry if one doesn't already exist
 */
router.post(
  '/users',
  ensureStorageMiddleware,
  handleResponse(async (req, res, next) => {
    let walletAddress = req.body.walletAddress
    if (!ethereumUtils.isValidAddress(walletAddress)) {
      return errorResponseBadRequest('Ethereum address is invalid')
    }

    walletAddress = walletAddress.toLowerCase()

    const existingUser = await models.CNodeUser.findOne({
      where: {
        walletPublicKey: walletAddress
      }
    })
    if (existingUser) {
      return successResponse() // do nothing if user already exists
    }

    // Create CNodeUser entry for wallet with clock = 0
    await models.CNodeUser.create({
      walletPublicKey: walletAddress,
      clock: 0
    })

    return successResponse()
  })
)

/**
 * Return a challenge used for validating user login. Challenge value
 * is also set in redis cache with the key 'userLoginChallenge:<wallet>'.
 */
router.get(
  '/users/login/challenge',
  ensureStorageMiddleware,
  handleResponse(async (req, res, next) => {
    let walletPublicKey = req.query.walletPublicKey

    if (!walletPublicKey) {
      return errorResponseBadRequest('Missing wallet address.')
    }

    walletPublicKey = walletPublicKey.toLowerCase()
    const userLoginChallengeKey = `${CHALLENGE_PREFIX}${walletPublicKey}`
    const redisClient = req.app.get('redisClient')
    const challengeBuffer = await randomBytes(CHALLENGE_VALUE_LENGTH)
    const challengeBytes = base64url.encode(challengeBuffer)
    const challenge = `Click sign to authenticate with creator node: ${challengeBytes}`

    // Set challenge ttl to 2 minutes ('EX' option = sets expire time in seconds)
    // https://redis.io/commands/set
    // https://github.com/luin/ioredis/blob/master/examples/basic_operations.js#L44
    await redisClient.set(
      userLoginChallengeKey,
      challenge,
      'EX',
      CHALLENGE_TTL_SECONDS
    )

    return successResponse({ walletPublicKey, challenge })
  })
)

/**
 * Checks if challenge in request body matches up with what we have stored.
 * If request challenge matches what we have, remove instance from redis to
 * prevent replay attacks. Return sessionToken upon success.
 */
router.post(
  '/users/login/challenge',
  ensureStorageMiddleware,
  handleResponse(async (req, res, next) => {
    const { signature, data: theirChallenge } = req.body

    if (!signature || !theirChallenge) {
      return errorResponseBadRequest('Missing request body values.')
    }

    let address
    try {
      address = utils.verifySignature(theirChallenge, signature)
      address = address.toLowerCase()
    } catch (e) {
      return errorResponseBadRequest(`Unable to verify signature: ${e}`)
    }

    const user = await models.CNodeUser.findOne({
      where: {
        walletPublicKey: address
      }
    })
    if (!user) {
      return errorResponseBadRequest('Invalid data or signature')
    }

    const redisClient = req.app.get('redisClient')
    const userLoginChallengeKey = `${CHALLENGE_PREFIX}${address}`
    const ourChallenge = await redisClient.get(userLoginChallengeKey)

    if (!ourChallenge) {
      return errorResponseBadRequest('Missing challenge key')
    }

    if (theirChallenge !== ourChallenge) {
      return errorResponseBadRequest(`Invalid response.`)
    }

    await redisClient.del(userLoginChallengeKey)

    // All checks have passed! generate a new session token for the user
    const sessionToken = await sessionManager.createSession(user.cnodeUserUUID)
    return successResponse({ sessionToken })
  })
)

router.post(
  '/users/logout',
  authMiddleware,
  handleResponse(async (req, res, next) => {
    await sessionManager.deleteSession(
      req.get(sessionManager.sessionTokenHeader)
    )
    return successResponse()
  })
)

/**
 * Returns latest clock value stored in CNodeUsers entry given wallet, or -1 if no entry found
 * Returns boolean indicating whether a sync is in progress
 * Optionally returns info on total and skipped CIDs for user
 * Optionally returns user filesHash
 */
router.get(
  '/users/clock_status/:walletPublicKey',
  handleResponse(async (req, res) => {
    const redisClient = req.app.get('redisClient')

    const walletPublicKey = req.params.walletPublicKey.toLowerCase()
    const returnSkipInfo = req.query.returnSkipInfo === 'true' // default false
    const returnFilesHash = req.query.returnFilesHash === 'true' // default false
    const filesHashClockRangeMin =
      parseInt(req.query.filesHashClockRangeMin) || null
    const filesHashClockRangeMax =
      parseInt(req.query.filesHashClockRangeMax) || null

    const response = {}

    const cnodeUser = await models.CNodeUser.findOne({
      where: { walletPublicKey }
    })
    const cnodeUserUUID = cnodeUser ? cnodeUser.dataValues.cnodeUserUUID : null
    const clockValue = cnodeUser ? cnodeUser.dataValues.clock : -1
    response.clockValue = clockValue

    async function fetchCIDSkipInfoIfRequested() {
      if (returnSkipInfo) {
        // Set response to default values
        response.CIDSkipInfo = { numCIDs: 0, numSkippedCIDs: 0 }

        if (cnodeUserUUID) {
          const countsQuery = (
            await sequelize.query(
              `
            select
              count(*) as "numCIDs",
              count(case when "skipped" = true then 1 else null end) as "numSkippedCIDs"
            from "Files"
            where "cnodeUserUUID" = :cnodeUserUUID
          `,
              { replacements: { cnodeUserUUID } }
            )
          )[0][0]

          const numCIDs = parseInt(countsQuery.numCIDs)
          const numSkippedCIDs = parseInt(countsQuery.numSkippedCIDs)

          response.CIDSkipInfo = { numCIDs, numSkippedCIDs }
        }
      }
    }

    async function isSyncInProgress() {
      let syncInProgress = false
      try {
        syncInProgress = await redisClient.WalletWriteLock.syncIsInProgress(
          walletPublicKey
        )
      } catch (e) {
        // Swallow error, leave syncInProgress unset
      }

      response.syncInProgress = syncInProgress
    }

    async function fetchFilesHashIfRequested() {
      if (returnFilesHash) {
        // Set response to default values
        response.filesHash = null
        if (filesHashClockRangeMin || filesHashClockRangeMax) {
          response.filesHashForClockRange = null
        }

        if (cnodeUserUUID) {
          const filesHash = await DBManager.fetchFilesHashFromDB({
            lookupKey: { lookupCNodeUserUUID: cnodeUserUUID }
          })
          response.filesHash = filesHash

          if (filesHashClockRangeMin || filesHashClockRangeMax) {
            const filesHashForClockRange = await DBManager.fetchFilesHashFromDB(
              {
                lookupKey: { lookupCNodeUserUUID: cnodeUserUUID },
                clockMin: filesHashClockRangeMin,
                clockMax: filesHashClockRangeMax
              }
            )
            response.filesHashForClockRange = filesHashForClockRange
          }
        }
      }
    }

    await Promise.all([
      fetchCIDSkipInfoIfRequested(),
      isSyncInProgress(),
      fetchFilesHashIfRequested()
    ])

    return successResponse(response)
  })
)

/**
 * Returns latest clock value for CNodeUser, or -1 if no entry found
 * Optionally returns user filesHash, or null if no files found
 */
router.post(
  '/users/batch_clock_status',
  handleResponse(async (req, res) => {
    const { walletPublicKeys /* [walletPublicKey] */ } = req.body

    if (walletPublicKeys == null) {
      return errorResponseBadRequest(
        'Must provide valid walletPublicKeys field in request body'
      )
    }

    const walletPublicKeysSet = new Set(walletPublicKeys)

    // Enforce max # of wallets to prevent high db query time
    const maxNumWallets = config.get('maxBatchClockStatusBatchSize')
    if (walletPublicKeysSet.size > maxNumWallets) {
      return errorResponseBadRequest(
        `Number of wallets must not exceed ${maxNumWallets} (reduce 'walletPublicKeys' field in request body).`
      )
    }

    const returnFilesHash = req.query.returnFilesHash === 'true' // default false

    // Initialize users response object with default values
    const users = {}
    walletPublicKeys.forEach((wallet) => {
      const user = {
        walletPublicKey: wallet,
        clock: -1
      }
      if (returnFilesHash) {
        user.filesHash = null
      }
      users[wallet] = user
    })

    // Fetch all cnodeUsers for wallets
    const cnodeUsers = await models.CNodeUser.findAll({
      where: {
        walletPublicKey: {
          [models.Sequelize.Op.in]: walletPublicKeys
        }
      }
    })

    // Populate users response object with cnodeUsers data
    cnodeUsers.forEach(({ walletPublicKey, clock }) => {
      users[walletPublicKey].walletPublicKey = walletPublicKey
      users[walletPublicKey].clock = clock
    })

    // Fetch filesHashes if requested
    if (returnFilesHash && cnodeUsers.length > 0) {
      // Fetch filesHashes
      const cnodeUserUUIDs = cnodeUsers.map(
        (cnodeUser) => cnodeUser.cnodeUserUUID
      )
      const filesHashesByCNodeUserUUID = await DBManager.fetchFilesHashesFromDB(
        { cnodeUserUUIDs }
      )

      // Populate users response object with filesHash data
      const cnodeUserUUIDToWalletMap = {}
      cnodeUsers.forEach((cnodeUser) => {
        cnodeUserUUIDToWalletMap[cnodeUser.cnodeUserUUID] =
          cnodeUser.walletPublicKey
      })
      Object.entries(filesHashesByCNodeUserUUID).forEach(
        ([cnodeUserUUID, filesHash]) => {
          const wallet = cnodeUserUUIDToWalletMap[cnodeUserUUID]
          users[wallet].filesHash = filesHash
        }
      )
    }

    // Convert response object from map(wallet => { info }) to [{ info }]
    const usersResp = Object.values(users)

    return successResponse({ users: usersResp })
  })
)

module.exports = router
