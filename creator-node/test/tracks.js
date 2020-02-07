const request = require('supertest')
const fs = require('fs')
const path = require('path')
const expect = require('chai').expect
const defaultConfig = require('../default-config.json')

const blacklistManager = require('../src/blacklistManager')

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

    const appInfo = await getApp(ipfsMock, libsMock, blacklistManager)
    await blacklistManager.blacklist(ipfsMock)

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

    ipfsMock.addFromFs.exactly(33)
    ipfsMock.pin.add.exactly(33)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session)
      .expect(200)

    expect(resp1.body.track_segments[0].multihash).to.equal('testCIDLink')
    expect(resp1.body.track_segments.length).to.equal(32)
    expect(resp1.body.source_file).to.contain('.mp3')
    expect(resp1.body.transcodedTrackCID).to.equal('testCIDLink')
    expect(resp1.body.transcodedTrackUUID).be.a('string')
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

    expect(resp1.body.track_segments[0].multihash).to.equal('testCIDLink')
    expect(resp1.body.track_segments.length).to.equal(32)
    expect(resp1.body.source_file).to.contain('.mp3')

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }]
    }

    const resp2 = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session)
      .send({ metadata, sourceFile: resp1.body.source_file })
      .expect(200)

    expect(resp2.body.metadataMultihash).to.equal('testCIDLink')
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

    expect(resp1.body.track_segments[0].multihash).to.equal('testCIDLink')
    expect(resp1.body.track_segments.length).to.equal(32)
    expect(resp1.body.source_file).to.contain('.mp3')

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1
    }

    await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session)
      .send({ metadata, sourceFile: resp1.body.source_file })
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

    expect(resp1.body.track_segments[0].multihash).to.equal('testCIDLink')
    expect(resp1.body.track_segments.length).to.equal(32)
    expect(resp1.body.source_file).to.contain('.mp3')

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'incorrectCIDLink', 'duration': 1000 }],
      owner_id: 1
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session)
      .send({ metadata, sourceFile: resp1.body.source_file })
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

    expect(resp1.body.track_segments[0].multihash).to.equal('testCIDLink')
    expect(resp1.body.track_segments.length).to.equal(32)
    expect(resp1.body.source_file).to.contain('.mp3')

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }]
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session)
      .send({ metadata, sourceFile: resp1.body.source_file })
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

    expect(resp1.body.track_segments[0].multihash).to.equal('testCIDLink')
    expect(resp1.body.track_segments.length).to.equal(32)
    expect(resp1.body.source_file).to.contain('.mp3')

    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }],
      owner_id: 1
    }

    const resp2 = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session)
      .send({ metadata, sourceFile: resp1.body.source_file })
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

  // depends on "upload file to IPFS"
  it.only('fails to download downloadable track with no track_id and no source_id present', async function () {
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

    expect(resp1.body.track_segments[0].multihash).to.equal('testCIDLink')
    expect(resp1.body.track_segments.length).to.equal(32)
    // expect(resp1.body.source_file).to.contain('.mp3')

    // creates a downloadable Audius track with no track_id and no source_file
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }],
      download: {
        is_downloadable: true,
        requires_follow: false
      }
    }

    await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(400)
  })

  it.only('downloads downloadable track with no track_id', async function () {
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

    expect(resp1.body.track_segments[0].multihash).to.equal('testCIDLink')
    expect(resp1.body.track_segments.length).to.equal(32)
    expect(resp1.body.source_file).to.contain('.mp3')

    // creates a downloadable Audius track with no track_id and no source_file
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }],
      download: {
        is_downloadable: true,
        requires_follow: false
      }
    }

    const resp2 = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session)
      .send({ metadata, sourceFile: resp1.body.source_file })
      .expect(200)

    expect(resp2.body.metadataMultihash).to.equal('testCIDLink')
  })

  // TODO
  // it.only('fails to download an undownloadable track')
})
