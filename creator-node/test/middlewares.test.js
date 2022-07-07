const fs = require('fs')
const path = require('path')
const request = require('supertest')
const assert = require('assert')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getLibsMock } = require('./lib/libsMock')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')

describe.only('test middlewares', function () {
  let server, app, session

  afterEach(async function () {
    await server.close()
  })

  describe('test ensureAppIsOnline middleware', function () {
    it('If the terminate signal is enabled, do not allow content upload', async function () {
      const libsMock = getLibsMock()

      process.env.terminateApp = true

      const appInfo = await getApp(libsMock)

      app = appInfo.app
      server = appInfo.server
      session = await createStarterCNodeUser(1 /* userId */)

      const file = fs.readFileSync(testAudioFilePath)

      const resp = await request(app)
        .post('/track_content_async')
        .attach('file', file, { filename: 'fname.jpg' })
        .set('Content-Type', 'multipart/form-data')
        .set('X-Session-ID', session.sessionToken)
        .set('User-Id', session.userId)
        .expect(403)

      assert.deepStrictEqual(resp.body.error, 'App shutdown in sequence')
    })

    it('If the terminate signal is not enabled, allow rest of route to continue', async function () {
      const libsMock = getLibsMock()

      process.env.terminateApp = false

      const appInfo = await getApp(libsMock)

      app = appInfo.app
      server = appInfo.server
      session = await createStarterCNodeUser(1 /* userId */)

      const file = fs.readFileSync(testAudioFilePath)

      const resp = await request(app)
        .post('/track_content_async')
        .attach('file', file, { filename: 'fname.jpg' })
        .set('Content-Type', 'multipart/form-data')
        .set('X-Session-ID', session.sessionToken)
        .set('User-Id', session.userId)

      assert.ok(
        !resp.body.error || resp.body.error !== 'App shutdown in sequence'
      )
    })

    it('If the terminate signal is not set, allow rest of route to continue', async function () {
      const libsMock = getLibsMock()

      delete process.env.terminateApp

      const appInfo = await getApp(libsMock)

      app = appInfo.app
      server = appInfo.server
      session = await createStarterCNodeUser(1 /* userId */)

      const file = fs.readFileSync(testAudioFilePath)

      const resp = await request(app)
        .post('/track_content_async')
        .attach('file', file, { filename: 'fname.jpg' })
        .set('Content-Type', 'multipart/form-data')
        .set('X-Session-ID', session.sessionToken)
        .set('User-Id', session.userId)

      assert.ok(
        !resp.body.error || resp.body.error !== 'App shutdown in sequence'
      )
    })
  })
})
