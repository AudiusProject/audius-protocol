const assert = require('assert')
const request = require('supertest')
const fs = require('fs-extra')
const path = require('path')
const nock = require('nock')

const { createStarterCNodeUser } = require('./lib/dataSeeds.js')
const { getApp } = require('./lib/app.js')
const { getLibsMock } = require('./lib/libsMock.js')
const { uploadTrack } = require('./lib/helpers.js')
const DiskManager = require('../src/diskManager.js')
const redis = require('../src/redis')
const utils = require('../src/utils')

const ipfsClient = require('../src/ipfsClient.js')
const BlacklistManager = require('../src/blacklistManager.js')

/**
 * Other tests that may be useful to add:
 * - legacy storage path
 * - bytesRange
 * - track stream route tests
 * - dirCID route tests
 */

describe('Test /ipfs/:cid route', function () {
  let app, server, userId, session

  /**
   * Init IPFS, libs, app, server
   * Create initial user
   */
  const init = async function () {
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
  }

  /** flush redis */
  beforeEach(async function () {
    await redis.flushall()
  })

  /** Close server + reset redis */
  afterEach(async function () {
    await redis.flushall()
    await server.close()
    nock.cleanAll()
  })

  it('400 on invalid CID format', async function () {
    await init()

    const CID = 'asdfasdf'
    await request(app)
      .get(`/ipfs/${CID}`)
      .expect(400, {
        error: `[getCID] [CID=${CID}] Invalid CID`
      })
  })

  it('400 if CID points to dir', async function () {
    await init()

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

  it('Confirm metadata file streams correctly when on disk', async function () {
    await init()

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

  it('Confirm track files stream correctly when on disk', async function () {
    await init()

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

    resp = await request(app)
      .get(`/ipfs/${transcodedTrackCID}`)
      .expect(200)
      .expect('cache-control', 'public, max-age=2592000, immutable')

    // TODO check full response
  })

  it('404 if CID not present on disk or DB', async function () {
    await init()

    const CID = 'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W'

    await request(app)
      .get(`/ipfs/${CID}`)
      .expect(404, {
        error: `[getCID] [CID=${CID}] No valid file found for provided CID`
      })
  })

  it('error if CID found on DB but points to dir', async function () {
    await init()
    
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

    // Remove dir from disk
    const dirPath = DiskManager.computeFilePath(CID, false)
    console.log(`SIDTEST DIRPATH: ${dirPath}`)
    await fs.remove(dirPath)

    await request(app)
      .get(`/ipfs/${CID}`)
      .expect(400, {
        error: `[getCID] [CID=${CID}] this dag node is a directory`
      })
  })

  it('Confirm metadata file does not stream when not on disk, not in network, and in DB (IPFS retrieval disabled)', async function () {
    // Disable IPFS retrieval to ensure unavail
    process.env.IPFSRetrievalEnabled = false

    await init()
    
    let resp

    const metadata = { test: 'field1 '}

    resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-ID', session.userId)
      .send({ metadata })
      .expect(200)

    const CID = resp.body.data.metadataMultihash

    // Delete metadata file from disk
    const filePath = DiskManager.computeFilePath(CID, false)
    await fs.remove(filePath)

    // Mock failure response from one other content nodes
    const CN = ['http://mock-cn1.audius.co','http://cn2_creator-node_1:4001','http://cn3_creator-node_1:4002']
    CN.forEach(cn => {
      nock(cn)
        .persist()
        .get('/file_lookup')
        .query(obj => {
          return obj.filePath.includes(CID)
        })
        .reply(404)
    })

    await request(app)
      .get(`/ipfs/${CID}`)
      .expect(404, {
        error: `[getCID] [CID=${CID}] No valid file found for provided CID`
      })
  })

  it('Confirm metadata file streams correctly when not on disk, in DB, and in network', async function () {
    await init()
    
    let resp

    const metadata = { test: 'field1 '}

    resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-ID', session.userId)
      .send({ metadata })
      .expect(200)

    const CID = resp.body.data.metadataMultihash

    // Delete metadata file from disk
    const filePath = DiskManager.computeFilePath(CID, false)
    await fs.remove(filePath)

    // Mock success response from one other content node to ensure node can retrieve content
    const CN = ['http://mock-cn1.audius.co','http://cn2_creator-node_1:4001','http://cn3_creator-node_1:4002']
    CN.forEach(cn => {
      nock(cn)
        .persist()
        .get('/file_lookup')
        .query(obj => {
          return obj.filePath.includes(CID)
        })
        .reply(200, metadata)
    })

    resp = await request(app)
      .get(`/ipfs/${CID}`)
      .expect(200)
      .expect('cache-control', 'public, max-age=2592000, immutable')
      .expect('content-length', `${Buffer.byteLength(JSON.stringify(metadata))}`)
    assert.deepStrictEqual(JSON.parse(resp.text), metadata)
  })

  it('Confirm metadata file streams correctly when not on disk, in DB, not in network, but on IPFS', async function () {
    // Enable IPFS retrieval to ensure avail
    process.env.IPFSRetrievalEnabled = true

    await init()
    
    let resp

    const metadata = { test: 'field1 '}

    resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-ID', session.userId)
      .send({ metadata })
      .expect(200)

    const CID = resp.body.data.metadataMultihash

    // Delete metadata file from disk
    const filePath = DiskManager.computeFilePath(CID, false)
    await fs.remove(filePath)

    // Mock failure response from one other content nodes
    const CN = ['http://mock-cn1.audius.co','http://cn2_creator-node_1:4001','http://cn3_creator-node_1:4002']
    CN.forEach(cn => {
      nock(cn)
        .persist()
        .get('/file_lookup')
        .query(obj => {
          return obj.filePath.includes(CID)
        })
        .reply(404)
    })

    resp = await request(app)
      .get(`/ipfs/${CID}`)
      .expect(200)
      .expect('cache-control', 'public, max-age=2592000, immutable')
      .expect('content-length', `${Buffer.byteLength(JSON.stringify(metadata))}`)
    assert.deepStrictEqual(JSON.parse(resp.text), metadata)
  })
})