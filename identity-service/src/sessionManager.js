const crypto = require('crypto')
const base64url = require('base64-url')
const { promisify } = require('util')
const randomBytes = promisify(crypto.randomBytes)

const models = require('./models')
const Op = models.Sequelize.Op

const sessionTokenHeaderKey = 'X-Session-ID'
const sessionTokenLength = 40

class SessionManager {
  static get sessionTokenHeader () {
    return sessionTokenHeaderKey
  }

  static async createSession (userId) {
    const tokenBuffer = await randomBytes(sessionTokenLength)
    const token = base64url.encode(tokenBuffer)

    await models.SessionToken.create({ userId, token })

    return token
  }

  static async verifySession (sessionToken) {
    const session = await _getTokenModel(sessionToken, false)
    if (!session) {
      return null
    }

    return session.userId
  }

  static async deleteSession (sessionToken) {
    const session = await _getTokenModel(sessionToken, true)
    await session.destroy()
  }

  static async deleteAllSessionsExceptCurrent (sessionToken) {
    const session = await _getTokenModel(sessionToken, true)
    await models.SessionToken.destroy({ where: { id: { [Op.ne]: session.id } } })
  }
}

async function _getTokenModel (sessionToken, throwOnError) {
  const session = await models.SessionToken.findOne({ where: { token: sessionToken } })
  if (throwOnError && !session) {
    throw new Error('Invalid session')
  }
  return session
}

module.exports = SessionManager
