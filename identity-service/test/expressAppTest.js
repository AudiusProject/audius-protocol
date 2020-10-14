const request = require('supertest')
const sinon = require('sinon')

const { getApp } = require('./lib/app')

describe('test /health_check and /balance_check', function () {
  let app, server, req
  beforeEach(async () => {
    const appInfo = await getApp(null, null)
    app = appInfo.app
    server = appInfo.server
    sinon.stub(req).returns({ app: {} })
    sinon.stub(req.app, 'get').withArgs('audiusLibs').returns(getLibsMock())
  })
  afterEach(async () => {
    await server.close()
  })

  it('responds 200 for health check', function (done) {
    request(app)
      .get('/health_check')
      .expect(200, done)
  })

  it('responds to balance check', function (done) {
    // 200 if balance === 1
    // 500 if balance < 1
    request(app)
      .get('/balance_check')
      .expect((res) => {
        if (res.status !== 200 && res.status !== 500) {
          throw new Error('Not a valid status code')
        }
      })
      .end((err, res) => {
        if (err) return done(err)
        done()
      })
  })

  it('responds 404 for invalid route', function (done) {
    request(app)
      .get('/invalid_route')
      .expect(404, done)
  })
})

function getLibsMock () {
  const libsMock = {
    ethContracts: {
      ServiceProviderFactoryClient: {
        getServiceProviderIdFromEndpoint: sinon.mock().atLeast(1),
        getServiceEndpointInfo: sinon.mock().atLeast(1)
      }
    },
    User: {
      getUsers: sinon.mock()
    },
    discoveryProvider: {
      discoveryProviderEndpoint: 'http://docker.for.mac.localhost:5000'
    }
  }
  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint.returns('1')
  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo.returns({
    'endpoint': 'http://localhost:5000',
    owner: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25',
    spID: '1',
    type: 'creator-node',
    blockNumber: 1234,
    delegateOwnerWallet: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25'
  })
  libsMock.User.getUsers.returns([{ 'creator_node_endpoint': 'http://localhost:5000', 'blocknumber': 10, 'track_blocknumber': 10 }])
  libsMock.User.getUsers.atMost(10)

  return libsMock
}
