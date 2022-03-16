const assert = require('assert')
const request = require('supertest')
const fs = require('fs-extra')
const path = require('path')

const { createStarterCNodeUser } = require('./lib/dataSeeds.js')
const { getApp } = require('./lib/app.js')
const { getLibsMock } = require('./lib/libsMock.js')
const { uploadTrack } = require('./lib/helpers.js')

const ipfsClient = require('../src/ipfsClient.js')
const BlacklistManager = require('../src/blacklistManager.js')

describe('Test /ipfs/:cid route', function () {
  let app, server, userId, session

  /**
   * Init IPFS, libs, app, server
   * Create initial user
   */
  beforeEach(async function () {
    const ipfs = ipfsClient.ipfs
    const ipfsLatest = ipfsClient.ipfsLatest

    const libsMock = getLibsMock()

    userId = 1

    const appInfo = await getApp(ipfs, libsMock, BlacklistManager, ipfsLatest, null, userId)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server

    // Create user
    session = await createStarterCNodeUser(userId)
  })

  /** Close server */
  afterEach(async function () {
    await server.close()
  })

  it('400 on invalid CID format', async function () {
    const CID = 'asdfasdf'
    await request(app)
      .get(`/ipfs/${CID}`)
      .expect(400, {
        error: `[getCID] [CID=${CID}] Invalid CID`
      })
  })

  it.skip('TODO blacklisted content', async function () {})

  /**
   * - error if CID on disk and other type
   * 
   * - if CID on disk at new storage path
   *  - successfully streamed from disk
   *    - track segment
   *    - other...
   * - if CID on disk at old storage path
   *  - successfully streamed from disk
   * - if CID not on disk, check DB
   * - error if not found in DB
   * - error if found in DB with dir type
   * - if found in DB
   *  - mock network request for retrieval, confirm successfully streamed
   *  - if not found in network, error
   */

  it('400 if CID points to dir', async function () {
    const imageFilePath = path.resolve(__dirname, 'assets/static_image.png')
    const file = await fs.readFile(imageFilePath)
    const resp = await request(app)
      .post('/image_upload')
      .attach('file', file, { filename: 'filename.jpg' })
      .field('square', true)
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    const CID = resp.body.data.dirCID

    await request(app)
      .get(`/ipfs/${CID}`)
      .expect(400, {
        error: `[getCID] [CID=${CID}] this dag node is a directory`
      })
  })

  it('Confirm metadata file streams correctly', async function () {
    let resp

    const metadata = { test: 'field1 '}

    resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-ID', session.userId)
      .send({ metadata })
      .expect(200)

    const CID = resp.body.data.metadataMultihash

    resp = await request(app)
      .get(`/ipfs/${CID}`)
      .expect(200)
      .expect('cache-control', 'public, max-age=2592000, immutable')
      .expect('content-length', `${Buffer.byteLength(JSON.stringify(metadata))}`)
    assert.deepStrictEqual(JSON.parse(resp.text), metadata)
  })

  it('Confirm track segment file streams correctly', async function () {
    let resp

    const trackFilePath = path.resolve(__dirname, 'assets/testTrack.mp3')
    const {
      track_segments: trackSegments, transcodedTrackCID
    } = await uploadTrack(trackFilePath, session.cnodeUserUUID)

    const segmentCID = trackSegments[0].multihash
    resp = await request(app)
      .get(`/ipfs/${segmentCID}`)
      .expect(200)
      .expect('cache-control', 'public, max-age=2592000, immutable')
    
    // TODO check full response

    // TODO check segment response content-length against file storage
    // (await fs.stat(trackFilePath)).size

    resp = await request(app)
      .get(`/ipfs/${transcodedTrackCID}`)
      .expect(200)
      .expect('cache-control', 'public, max-age=2592000, immutable')

    // TODO check full response

    // TODO check segment response content-length against file storage
    // (await fs.stat(trackFilePath)).size
  })
})