const request = require('supertest')

const { getApp } = require('./lib/app')

describe('test relay endpoint', function () {
  let app, server
  beforeEach(async () => {
    const appInfo = await getApp(null, null)
    app = appInfo.app
    server = appInfo.server
  })
  afterEach(async () => {
    await server.close()
  })

  it('responds 500 for incorrect relay params', function (done) {
    request(app)
      .post('/relay')
      .send({
        contractRegistryKey: '0xaaaaaaaaaaaaaaaaaaa',
        contractAddress: '0xaaaaaaaaaaaaaaaaaaa',
        senderAddress: '0xaaaaaaaaaaaaaaaaaaa'
      })
      .expect(500, done)
  })

  it('responds to correct relay params', function (done) {
    request(app)
      .post('/relay')
      .send({
        contractRegistryKey: '0xaaaaaaaaaaaaaaaaaaa',
        contractAddress: '0xaaaaaaaaaaaaaaaaaaa',
        senderAddress: '0xaaaaaaaaaaaaaaaaaaa',
        encodedABI: 'aaaaaaaaaaaaaaaaaaa'
      })
      // this is 500 because the abi decoder can't find the contract address
      // and haven't mocked this yet
      .expect(500, done)
  })
})
