const crypto = require('crypto')
const base64url = require('base64-url')
const { promisify } = require('util')
const randomBytes = promisify(crypto.randomBytes)

const redisClient = require('./redis')

const sessionTokenHeaderKey = 'X-Session-ID'
const sessionTokenLength = 40
const sessionTokenTTLSeconds = 86400 // 24hrs

/** Manage sessions with redis and DB. */
class SessionManager {
  static get sessionTokenHeader () {
    return sessionTokenHeaderKey
  }

  static async createSession (cnodeUserUUID) {
    const tokenBuffer = await randomBytes(sessionTokenLength)
    const token = base64url.encode(tokenBuffer)

    await redisClient.set(`SESSION.${token}`, cnodeUserUUID, 'EX', sessionTokenTTLSeconds)

    return token
  }

  /** Return cnodeUserUUID associated with token if exists, else null. */
  static async verifySession (sessionToken) {
    return _getSessionFromRedis(sessionToken)
  }

  static async deleteSession (sessionToken) {
    await redisClient.del(`SESSION.${sessionToken}`)
  }
}

async function _getSessionFromRedis (token) {
  return redisClient.get(`SESSION.${token}`)
}


module.exports = SessionManager
