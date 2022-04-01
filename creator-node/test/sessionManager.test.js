const assert = require('assert')
const sinon = require('sinon')

const models = require('../src/models')
const { SessionToken } = models
const DBManager = require('../src/dbManager')
const SessionManager = require('../src/sessionManager')
const BlacklistManager = require('../src/blacklistManager')
const redisClient = require('../src/redis')
const { createStarterCNodeUser, getCNodeUser, destroyUsers, createSession } = require('./lib/dataSeeds')
const { getApp } = require('./lib/app')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

describe('SessionManager', async function () {
  let appInfo, server
  const initialClockVal = 0
  let cnodeUserUUID

  /** Init server to run DB migrations */
  before(async function () {
    appInfo = await getApp(getIPFSMock(), getLibsMock(), BlacklistManager)
    server = appInfo.server
  })

  /** Reset DB and Redis state + Create cnodeUser + confirm initial clock state + define global vars */
  beforeEach(async function () {
    // Wipe Redis
    await redisClient.flushdb()
    // Wipe all CNodeUsers + dependent data
    await destroyUsers()
    const resp = await createStarterCNodeUser()
    cnodeUserUUID = resp.cnodeUserUUID
    // Confirm initial clock val in DB
    const cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal)
  })

  /** Wipe all CNodeUsers + dependent data */
  after(async function () {
    await destroyUsers()
    await server.close()
  })

  describe('deleteSessions', async function () {
    let testSession1, testSession2
    beforeEach(async function () {
      testSession1 = await createSession()
      testSession2 = await createSession()
    })
    describe('when called with an Array of SessionTokens', async function () {
      let sessionsToDelete
      beforeEach(async function () {
        sessionsToDelete = [testSession1, testSession2]
      })
      describe('and the DB transaction succeeds', async function () {
        beforeEach(async function () {
          await SessionManager.deleteSessions(sessionsToDelete)
        })
        it('deletes sessions from Redis', async function () {
          let deletedTestSessionInCache1 = await redisClient.get(`SESSION.${testSession1.token}`)
          let deletedTestSessionInCache2 = await redisClient.get(`SESSION.${testSession2.token}`)
          assert(deletedTestSessionInCache1 === null)
          assert(deletedTestSessionInCache2 === null)
        })
        it('deletes sessions from the DB', async function () {
          let deletedTestSession1 = await SessionToken.findByPk(testSession1.id)
          let deletedTestSession2 = await SessionToken.findByPk(testSession2.id)
          assert(deletedTestSession1 === null)
          assert(deletedTestSession2 === null)
        })
      })
      describe('and the DB transaction fails', async function () {
        let dbManagerDeleteSessionTokensFromDBStub, retrySpy
        beforeEach(async function () {
          dbManagerDeleteSessionTokensFromDBStub = sinon.stub(DBManager, 'deleteSessionTokensFromDB')
          dbManagerDeleteSessionTokensFromDBStub.onFirstCall().rejects()
        })
        afterEach(async function () {
          dbManagerDeleteSessionTokensFromDBStub.resetHistory()
          sinon.restore()
        })
        it('retries the transaction', async function () {
          retrySpy = sinon.spy()
          dbManagerDeleteSessionTokensFromDBStub.onSecondCall().callsFake(retrySpy)
          await SessionManager.deleteSessions(sessionsToDelete)
          assert(retrySpy.called)
        })
        describe('when the second DB transaction does not fail', async function () {
          beforeEach(async function () {
            dbManagerDeleteSessionTokensFromDBStub.callThrough()
            await SessionManager.deleteSessions(sessionsToDelete)
          })
          it('deletes sessions from Redis', async function () {
            let deletedTestSessionInCache1 = await redisClient.get(`SESSION.${testSession1.token}`)
            let deletedTestSessionInCache2 = await redisClient.get(`SESSION.${testSession2.token}`)
            assert(deletedTestSessionInCache1 === null)
            assert(deletedTestSessionInCache2 === null)
          })
          it('deletes sessions from the DB', async function () {
            let deletedTestSession1 = await SessionToken.findByPk(testSession1.id)
            let deletedTestSession2 = await SessionToken.findByPk(testSession2.id)
            assert(deletedTestSession1 === null)
            assert(deletedTestSession2 === null)
          })
        })
        describe('and the second DB transaction fails', async function () {
          beforeEach(async function () {
            dbManagerDeleteSessionTokensFromDBStub.onSecondCall().rejects()
          })
          it('throws an error', async function () {
            assert.rejects(async function () {
              await SessionManager.deleteSessions(sessionsToDelete)
            })
          })
        })
        describe('and the Redis transaction fails', async function () {
          let redisMultiStub
          beforeEach(async function () {
            redisMultiStub = sinon.stub(redisClient, 'multi')
            redisMultiStub.rejects()
          })
          it('throws an error', async function () {
            assert.rejects(async function () {
              await SessionManager.deleteSessions(sessionsToDelete)
            })
          })
        })
      })
    })
  })
})
