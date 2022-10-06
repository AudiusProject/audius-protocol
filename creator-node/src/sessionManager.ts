import { promisify } from 'util'
import crypto from 'crypto'
import base64url from 'base64-url'
import DBManager from './dbManager'

const randomBytes = promisify(crypto.randomBytes)
const models = require('./models')
const redisClient = require('./redis')

const sessionTokenHeaderKey = 'X-Session-ID'
const sessionTokenLength = 40

/** Manage sessions with redis and DB. */

export const sessionTokenHeader = sessionTokenHeaderKey

export async function createSession(cnodeUserUUID: string) {
  const tokenBuffer = await randomBytes(sessionTokenLength)
  const token = base64url.encode(tokenBuffer.toString())

  const session = await models.SessionToken.create({ cnodeUserUUID, token })
  await redisClient.set(`SESSION.${token}`, session.cnodeUserUUID)

  return token
}

/** Return cnodeUserUUID associated with token if exists, else null. */
export async function verifySession(sessionToken: string) {
  let session = await _getSessionFromRedis(sessionToken)
  if (session) {
    return session
  }

  session = await _getSessionFromDB(sessionToken, false)
  return session ? session.cnodeUserUUID : null
}

export async function deleteSession(sessionToken: string) {
  const session = await _getSessionFromDB(sessionToken, true)
  await session.destroy()
  await redisClient.del(`SESSION.${sessionToken}`)
}

export async function deleteSessions(sessionTokens: { token: string }[]) {
  const txCommands = sessionTokens.map(({ token }) => [
    'del',
    `SESSION.${token}`
  ])
  try {
    await DBManager.deleteSessionTokensFromDB(sessionTokens)
  } catch (e1: any) {
    try {
      await DBManager.deleteSessionTokensFromDB(sessionTokens)
    } catch (e2: any) {
      throw new Error(
        `[sessionManager]: Failure (and retry failure) when deleting expired sessions from DB: ${e1.message}\n$`
      )
    }
  }
  try {
    await redisClient.multi(txCommands).exec()
  } catch (e: any) {
    throw new Error(
      `[sessionManager]: Error when deleting expired sessions from Redis: ${e.message}`
    )
  }
}

async function _getSessionFromRedis(token: string) {
  return redisClient.get(`SESSION.${token}`)
}

async function _getSessionFromDB(sessionToken: string, throwOnError: boolean) {
  const session = await models.SessionToken.findOne({
    where: { token: sessionToken }
  })

  if (throwOnError && !session) {
    throw new Error('Invalid session')
  }
  return session
}
