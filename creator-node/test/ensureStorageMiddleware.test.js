const request = require('supertest')
const assert = require('assert')
const path = require('path')
const fs = require('fs')

const BlacklistManager = require('../src/blacklistManager')
const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

const { getMonitorRedisKey, MONITORS } = require('../src/monitors/monitors')

describe('test ensureStorageMiddleware', () => {
  const storagePathUsedRedisKey = getMonitorRedisKey(MONITORS.STORAGE_PATH_USED)
  let app, server, session, ipfsMock, libsMock, monitoringQueueMock, userId

  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    libsMock = getLibsMock()

    userId = 1

    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager, null, null, userId)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
    monitoringQueueMock = appInfo.mockServiceRegistry.monitoringQueue
    session = await createStarterCNodeUser(userId)
  })

  afterEach(async () => {
    await server.close()
  })

  it('fails with bad request when storage capacity is reached (/audius_users/metadata)', async () => {
    await monitoringQueueMock.setRedisValue(storagePathUsedRedisKey, 100)
    const storagePathUsed = await monitoringQueueMock.getRedisValue(storagePathUsedRedisKey)
    assert(storagePathUsed === '100')

    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ test: 'IMA STARBOY' })
      .expect(500)

    const errorObj = JSON.parse(resp.error.text)
    assert(errorObj.error.state === 'NODE_REACHED_CAPACITY')
  })

  it('fails with bad request when storage capacity is reached (/image_upload)', async () => {
    await monitoringQueueMock.setRedisValue(storagePathUsedRedisKey, 100)
    const storagePathUsed = await monitoringQueueMock.getRedisValue(storagePathUsedRedisKey)
    assert(storagePathUsed === '100')

    const testPicture = path.resolve(__dirname, 'testTrackWrongFormat.jpg')
    let file = fs.readFileSync(testPicture)
    const resp = await request(app)
      .post('/image_upload')
      .attach('file', file, { filename: 'abel.jpg' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(500)

    const errorObj = JSON.parse(resp.error.text)
    assert(errorObj.error.state === 'NODE_REACHED_CAPACITY')
  })

  it('fails with bad request when storage capacity is reached (/sync)', async () => {
    await monitoringQueueMock.setRedisValue(storagePathUsedRedisKey, 100)
    const storagePathUsed = await monitoringQueueMock.getRedisValue(storagePathUsedRedisKey)
    assert(storagePathUsed === '100')

    const resp = await request(app)
      .post('/sync')
      .send({
        wallet: ['0xvickywashere'],
        creator_node_endpoint: 'http://i-am-definitely-a-real-node.co',
        immediate: true
      })
      .expect(500)

    const errorObj = JSON.parse(resp.error.text)
    assert(errorObj.error.state === 'NODE_REACHED_CAPACITY')
  })

  it('fails with bad request when storage capacity is reached (/track_content)', async () => {
    await monitoringQueueMock.setRedisValue(storagePathUsedRedisKey, 100)
    const storagePathUsed = await monitoringQueueMock.getRedisValue(storagePathUsedRedisKey)
    assert(storagePathUsed === '100')

    const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')
    const file = fs.readFileSync(testAudioFilePath)
    const resp = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'STARBOY.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(500)

    const errorObj = JSON.parse(resp.error.text)
    assert(errorObj.error.state === 'NODE_REACHED_CAPACITY')
  })

  it('fails with bad request when storage capacity is reached (/tracks/metadata)', async () => {
    await monitoringQueueMock.setRedisValue(storagePathUsedRedisKey, 100)
    const storagePathUsed = await monitoringQueueMock.getRedisValue(storagePathUsedRedisKey)
    assert(storagePathUsed === '100')

    // Using the test track was "too big", so this is a dummy file buffer
    const file = Buffer.from('i am a track file!!!')

    const resp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send(
        {
          metadata: {
            test: 'abel is my hero',
            owner_id: 1,
            track_segments: ['tracksegment1', 'tracksegment2']
          },
          source_file: file
        }
      )
      .expect(500)

    const errorObj = JSON.parse(resp.error.text)
    assert(errorObj.error.state === 'NODE_REACHED_CAPACITY')
  })
})
