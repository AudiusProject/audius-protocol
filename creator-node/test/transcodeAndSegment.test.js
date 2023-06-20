const request = require('supertest')
const sinon = require('sinon')
const uuid = require('uuid')

const { getLibsMock } = require('./lib/libsMock')

describe('test transcode_and_segment route', function () {
  let app, server, testUuid

  before(function () {
    testUuid = uuid.v4()

    Object.keys(require.cache).forEach(function (key) {
      delete require.cache[key]
    })
  })

  beforeEach(async function () {
    // Update import to make ensureValidSPMiddleware pass
    const getContentNodeInfoFromSpId = async (spID, _genericLogger) => {
      switch (spID) {
        case 2:
          return {
            endpoint: 'http://mock-cn2.audius.co',
            owner: '0xBdb47ebFF0eAe1A7647D029450C05666e22864Fb',
            delegateOwnerWallet: '0xBdb47ebFF0eAe1A7647D029450C05666e22864Fb'
          }
        case 3:
          return {
            endpoint: 'http://mock-cn3.audius.co',
            owner: '0x1Fffaa556B42f4506cdb01D7BbE6a9bDbb0E5f36',
            delegateOwnerWallet: '0x1Fffaa556B42f4506cdb01D7BbE6a9bDbb0E5f36'
          }

        case 1:
          return {
            endpoint: 'http://mock-cn1.audius.co',
            owner: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25',
            delegateOwnerWallet: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25'
          }
        default:
          return {
            owner: '0x0000000000000000000000000000000000000000',
            endpoint: '',
            delegateOwnerWallet: '0x0000000000000000000000000000000000000000'
          }
      }
    }
    require.cache[require.resolve('../src/services/ContentNodeInfoManager')] = {
      exports: { getContentNodeInfoFromSpId }
    }
    const { getApp } = require('./lib/app')
    const appInfo = await getApp(
      /* libsMock */ getLibsMock(),
      null,
      /* setMockFn */ null,
      1 /* spId */
    )

    app = appInfo.app
    server = appInfo.server
  })

  afterEach(async () => {
    sinon.restore()
    if (server) {
      await server.close()
    }
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
