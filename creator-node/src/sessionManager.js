const crypto = require('crypto')
const base64url = require('base64-url')
const { promisify } = require('util')
const randomBytes = promisify(crypto.randomBytes)

const models = require('./models')
const redisClient = require('./redis')
const DBManager = require('./dbManager')

const sessionTokenHeaderKey = 'X-Session-ID'
const sessionTokenLength = 40

/** Manage sessions with redis and DB. */
class SessionManager {
  static get sessionTokenHeader () {
    return sessionTokenHeaderKey
  }

  static async createSession (cnodeUserUUID) {
    const tokenBuffer = await randomBytes(sessionTokenLength)
    const token = base64url.encode(tokenBuffer)

    const session = await models.SessionToken.create({ cnodeUserUUID, token })
    await redisClient.set(`SESSION.${token}`, session.cnodeUserUUID)

    return token
  }

  /** Return cnodeUserUUID associated with token if exists, else null. */
  static async verifySession (sessionToken) {
    let session = await _getSessionFromRedis(sessionToken)
    if (session) {
      return session
    }

    session = await _getSessionFromDB(sessionToken, false)
    return (session) ? session.cnodeUserUUID : null
  }

  static async deleteSession (sessionToken) {
    const session = await _getSessionFromDB(sessionToken, true)
    await session.destroy()
    await redisClient.del(`SESSION.${sessionToken}`)
  }

  static async deleteSessions (sessionTokens) {
    const txCommands = sessionTokens.map(({ token }) => ['del', `SESSION.${token}`])
    try {
      await DBManager.deleteSessionTokensFromDB(sessionTokens)
    } catch (e1) {
      try {
        await DBManager.deleteSessionTokensFromDB(sessionTokens)
      } catch (e2) {
        throw new Error(`[sessionManager]: Failure (and retry failure) when deleting expired sessions from DB: ${e1.message}\n$`)
      }
    }
    try {
      await redisClient.multi(txCommands).exec()
    } catch (e) {
      throw new Error(`[sessionManager]: Error when deleting expired sessions from Redis: ${e.message}`)
    }
  }
}

async function _getSessionFromRedis (token) {
  return redisClient.get(`SESSION.${token}`)
}

async function _getSessionFromDB (sessionToken, throwOnError) {
  const session = await models.SessionToken.findOne({ where: { token: sessionToken } })

  if (throwOnError && !session) {
    throw new Error('Invalid session')
  }
  return session
}

module.exports = SessionManager
