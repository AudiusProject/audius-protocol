const request = require('supertest')
const fs = require('fs')
const path = require('path')
const defaultConfig = require('../default-config.json')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')
const testAudioFileWrongFormatPath = path.resolve(__dirname, 'testTrackWrongFormat.jpg')

describe('test Tracks', function () {
  let app, server, session, ipfsMock, libsMock
  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    libsMock = getLibsMock()
    const appInfo = await getApp(ipfsMock, libsMock)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()
  })
  afterEach(async () => {
    await server.close()
  })

  it('fails to upload when format is not accepted', async function () {
    const file = fs.readFileSync(testAudioFileWrongFormatPath)

    await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.jpg' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(400)
  })

  it('fails to upload when maxAudioFileSizeBytes exceeded', async function () {
    // Configure extremely small file size
    process.env.maxAudioFileSizeBytes = 10

    // Reset app
    await server.close()

    ipfsMock = getIPFSMock()
    const appInfo = await getApp(ipfsMock)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()

    ipfsMock.add.exactly(64)
    ipfsMock.pin.add.exactly(32)

    // Confirm max audio file size is respected by multer
    let file = fs.readFileSync(testAudioFilePath)
    await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(500)

    // Reset max file limits
    process.env.maxAudioFileSizeBytes = defaultConfig['maxAudioFileSizeBytes']
    await server.close()
  })

  it('fails to upload when maxMemoryFileSizeBytes exceeded', async function () {
    // Configure extremely small file size
    process.env.maxMemoryFileSizeBytes = 10

    // Reset app
    await server.close()
    ipfsMock = getIPFSMock()
    const appInfo = await getApp(ipfsMock)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()

    ipfsMock.add.exactly(64)
    ipfsMock.pin.add.exactly(32)

    // Confirm max audio file size is respected by multer
    let file = fs.readFileSync(testAudioFileWrongFormatPath)
    await request(app)
      .post('/image_upload')
      .attach('file', file, { filename: 'fname.jpg' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(500)

    // Reset max file limits
    process.env.maxMemoryFileSizeBytes = defaultConfig['maxMemoryFileSizeBytes']
    await server.close()
  })

  it('uploads file to IPFS', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(32)
    ipfsMock.pin.add.exactly(32)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 32) {
      throw new Error('Incorrect return values')
    }
  })

  // depends on "upload file to IPFS"
  it('creates Audius track', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromAddress.exactly(2)
    libsMock.User.getUsers.exactly(2)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 32
    ) {
      throw new Error('Incorrect return values')
    }

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }]
    }

    const resp2 = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(200)

    if (resp2.body.metadataMultihash !== 'testCIDLink') {
      throw new Error('invalid return data')
    }
  })

  // depends on "upload file to IPFS"
  it('fails to create Audius track when segments not provided', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromAddress.exactly(2)
    libsMock.User.getUsers.exactly(2)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 32) {
      throw new Error('Incorrect return values')
    }

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1
    }

    await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(400)
  })

  // depends on "upload file to IPFS"
  it('fails to create Audius track when invalid segment multihashes are provided', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromAddress.exactly(2)
    libsMock.User.getUsers.exactly(2)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 32) {
      throw new Error('Incorrect return values')
    }

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'incorrectCIDLink', 'duration': 1000 }],
      owner_id: 1
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(400)
  })

  // depends on "upload file to IPFS"
  it('fails to create Audius track when owner_id is not provided', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromAddress.exactly(2)
    libsMock.User.getUsers.exactly(2)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 32) {
      throw new Error('Incorrect return values')
    }

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }]
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(400)
  })

  // depends on "upload file to IPFS" and "creates Audius user" tests
  it('completes Audius track creation', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromAddress.exactly(4)
    libsMock.User.getUsers.exactly(4)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    if (resp1.body.track_segments[0].multihash !== 'testCIDLink' ||
        resp1.body.track_segments.length !== 32) {
      throw new Error('Incorrect return values')
    }

    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }],
      owner_id: 1
    }

    const resp2 = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(200)

    if (resp2.body.metadataMultihash !== 'testCIDLink') {
      throw new Error('invalid return data')
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session)
      .send({ blockchainTrackId: 1, blockNumber: 10, metadataFileUUID: resp2.body.metadataFileUUID })
      .expect(200)
  })
})
