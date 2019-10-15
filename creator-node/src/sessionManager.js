const crypto = require('crypto')
const base64url = require('base64-url')
const { promisify } = require('util')
const randomBytes = promisify(crypto.randomBytes)

const models = require('./models')
const redisClient = require('./redis')

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
    const resp = await redisClient.set(`SESSION.${token}`, session.cnodeUserUUID)
    console.log(`createSession redisClient.set SESSION.${token} = ${session.cnodeUserUUID} response ${resp}`)

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
