const request = require('supertest')
const sinon = require('sinon')
const uuid = require('uuid')

const BlacklistManager = require('../src/blacklistManager')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

describe('test transcode_and_segment route', function () {
  let app, server, testUuid

  before(function () {
    testUuid = uuid.v4()
  })

  beforeEach(async function () {
    const appInfo = await getApp(
      /* libsMock */ getLibsMock(),
      BlacklistManager,
      /* setMockFn */ null,
      1 /* spId */
    )

    app = appInfo.app
    server = appInfo.server
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  it('if uuid/file name/file type is not passed in, return 400', async function () {
    await request(app)
      .get('/transcode_and_segment')
      .query({
        uuid: testUuid,
        fileName: undefined,
        fileType: 'transcode',
        // To pass ensureValidSPMiddleware
        spID: 1,
        timestamp: '2022-03-25T19:02:53.768Z',
        signature:
          '0xc0a8c42b1293174b5bc30cf307ac79dd0cf3f32009d58d1d6d228f489bd70d74096e1417b1f609cc5b1e57dcbc10d9d7b21246d492044721e7a4fe53f554e5e31b'
      })
      .expect(400)

    await request(app)
      .get('/transcode_and_segment')
      .query({
        uuid: undefined,
        fileName: 'filename',
        fileType: 'transcode',
        // To pass ensureValidSPMiddleware
        spID: 1,
        timestamp: '2022-03-25T19:02:53.768Z',
        signature:
          '0xc0a8c42b1293174b5bc30cf307ac79dd0cf3f32009d58d1d6d228f489bd70d74096e1417b1f609cc5b1e57dcbc10d9d7b21246d492044721e7a4fe53f554e5e31b'
      })
      .expect(400)

    await request(app)
      .get('/transcode_and_segment')
      .query({
        uuid: testUuid,
        fileName: 'filename',
        fileType: undefined,
        // To pass ensureValidSPMiddleware
        spID: 1,
        timestamp: '2022-03-25T19:02:53.768Z',
        signature:
          '0xc0a8c42b1293174b5bc30cf307ac79dd0cf3f32009d58d1d6d228f489bd70d74096e1417b1f609cc5b1e57dcbc10d9d7b21246d492044721e7a4fe53f554e5e31b'
      })
      .expect(400)
  })

  it('if path to file is improper, return 500', async function () {
    await request(app)
      .get('/transcode_and_segment')
      .query({
        uuid: testUuid,
        fileName: 'non-existant',
        fileType: 'transcode',
        // To pass ensureValidSPMiddleware
        spID: 1,
        timestamp: '2022-03-25T19:02:53.768Z',
        signature:
          '0xc0a8c42b1293174b5bc30cf307ac79dd0cf3f32009d58d1d6d228f489bd70d74096e1417b1f609cc5b1e57dcbc10d9d7b21246d492044721e7a4fe53f554e5e31b'
      })
      .expect(500)
  })
})
