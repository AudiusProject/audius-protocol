const request = require('supertest')
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const { getApp } = require('./lib/app')
const { createStarterUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')

const models = require('../src/models')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')

describe('test Tracks', function () {
  let app, server, session, ipfsMock
  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    const appInfo = await getApp(null, ipfsMock)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterUser()
  })
  afterEach(async () => {
    await server.close()
  })

  it('uploads file to IPFS', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.files.add.exactly(14)
    ipfsMock.pin.add.exactly(7)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 7) {
      throw new Error('Incorrect return values')
    }
  })

  // depends on "upload file to IPFS"
  it('creates Audius track', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.files.add.exactly(16)
    ipfsMock.pin.add.exactly(8)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 7) {
      throw new Error('Incorrect return values')
    }

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }]
    }

    const resp2 = await request(app)
      .post('/tracks')
      .set('X-Session-ID', session)
      .send(metadata)
      .expect(200)

    if (resp2.body.metadataMultihash !== 'testCIDLink' || resp2.body.id !== 1) {
      throw new Error('invalid return data')
    }
  })

  // depends on "upload file to IPFS"
  it('fails to create Audius track when segments not provided', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.files.add.exactly(16)
    ipfsMock.pin.add.exactly(8)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 7) {
      throw new Error('Incorrect return values')
    }

    // creates Audius track
    const metadata = {
      test: 'field1'
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session)
      .send(metadata)
      .expect(400)
  })

  // depends on "upload file to IPFS"
  it('fails to create Audius track when invalid segment multihashes are provided', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.files.add.exactly(16)
    ipfsMock.pin.add.exactly(8)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 7) {
      throw new Error('Incorrect return values')
    }

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'incorrectCIDLink', 'duration': 1000 }]
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session)
      .send(metadata)
      .expect(400)
  })

  // depends on "upload file to IPFS" and "creates Audius user" tests
  it('completes Audius track creation', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.files.add.exactly(16)
    ipfsMock.pin.add.exactly(8)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 7) {
      throw new Error('Incorrect return values')
    }

    // creates Audius user
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }]
    }

    const resp2 = await request(app)
      .post('/tracks')
      .set('X-Session-ID', session)
      .send(metadata)
      .expect(200)

    if (resp2.body.metadataMultihash !== 'testCIDLink' || resp2.body.id !== 1) {
      throw new Error('invalid return data')
    }

    // associates track with blockchain id
    request(app)
      .post('/tracks/associate/' + resp2.body.id)
      .set('X-Session-ID', session)
      .send({ blockchainTrackId: 1 })
      .expect(200)
  })

  it('fails to create listening activity with missing params', async function () {
    await request(app)
      .post('/tracks/1/listen')
      .expect(400)
    await request(app)
      .post('/tracks/asdf/listen')
      .send({ userId: 1 })
      .expect(400)
  })

  it('logs listening activity', async function () {
    await request(app)
      .post('/tracks/1/listen')
      .send({ userId: 1 })
      .expect(200)
    await request(app)
      .post('/tracks/4/listen')
      .send({ userId: 1 })
      .expect(200)
    await request(app)
      .post('/tracks/1/listen')
      .send({ userId: 1 })
      .expect(200)

    const listenCounts = await models.TrackListenCount.findAll()
    if (listenCounts.length !== 2) {
      throw new Error('invalid number of listen objects')
    }
    listenCounts.forEach((elem) => {
      if (elem.trackId === 1) {
        if (elem.listens !== 2) {
          throw new Error('Invalid listens for track 1')
        }
      } else if (elem.trackId === 4) {
        if (elem.listens !== 1) {
          throw new Error('Invalid listens for track 4')
        }
      } else {
        throw new Error('Invalid track ID')
      }
    })
  })

  it('fails to get listens when given no IDs', async function () {
    await request(app)
      .get('/tracks/listens')
      .expect(400)
  })

  it('returns accurate listening activity', async function () {
    await request(app)
      .post('/tracks/2/listen')
      .send({ userId: 1 })
      .expect(200)
    await request(app)
      .post('/tracks/1/listen')
      .send({ userId: 1 })
      .expect(200)
    await request(app)
      .post('/tracks/4/listen')
      .send({ userId: 1 })
      .expect(200)
    await request(app)
      .post('/tracks/2/listen')
      .send({ userId: 1 })
      .expect(200)

    const resp = await request(app)
      .get('/tracks/listens?id=2&id=4&id=6')
      .expect(200)

    let listenCounts = resp.body.listenCounts
    listenCounts.sort((a, b) => a.trackId - b.trackId)
    assert.deepStrictEqual(listenCounts, [ { trackId: 2, listens: 2 }, { trackId: 4, listens: 1 }, { trackId: 6, listens: 0 } ])
  })
})
