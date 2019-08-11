const request = require('supertest')
const sigUtil = require('eth-sig-util')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser, testEthereumConstants } = require('./lib/dataSeeds')

describe('test Users', function () {
  let app, server
  beforeEach(async () => {
    const appInfo = await getApp(null, null)
    app = appInfo.app
    server = appInfo.server
  })
  afterEach(async () => {
    await server.close()
  })

  it('creates new user', function (done) {
    request(app)
      .post('/users')
      .send({ walletAddress: testEthereumConstants.pubKey })
      .expect(200, done)
  })

  it('fails new user create on bad address', function (done) {
    request(app)
      .post('/users')
      .send({ walletAddress: '0x123' })
      .expect(400, done)
  })

  it('user create is idempotent', async function () {
    await createStarterCNodeUser()
    await request(app)
      .post('/users')
      .send({ walletAddress: testEthereumConstants.pubKey })
      .expect(200)
  })

  it('allows user login', async function () {
    await createStarterCNodeUser()
    const ts = Math.round((new Date()).getTime() / 1000)
    const data = 'This is a message:' + ts.toString()
    const signature = sigUtil.personalSign(Buffer.from(testEthereumConstants.privKeyHex, 'hex'), { data })
    await request(app)
      .post('/users/login')
      .send({ data, signature })
      .expect(200)
  })

  it('login returns valid token', async function () {
    await createStarterCNodeUser()
    const ts = Math.round((new Date()).getTime() / 1000)
    const data = 'This is a message:' + ts.toString()
    const signature = sigUtil.personalSign(Buffer.from(testEthereumConstants.privKeyHex, 'hex'), { data })
    const resp = await request(app)
      .post('/users/login')
      .send({ data, signature })
      .expect(200)
    await request(app)
      .post('/users/logout')
      .set('X-Session-ID', resp.body.sessionToken)
      .send({})
      .expect(200)
  })

  it('login fails on invalid signature', async function () {
    await createStarterCNodeUser()
    const ts = Math.round((new Date()).getTime() / 1000)
    const data = 'This is a message:' + ts.toString()

    // a valid signature that is not correct for the given message / timestamp
    const signature = '0x9e52d9c37a36629fa0c91481cd0c8f7754a1401452188f663e54845d6088247f4c37c811183d5c946f75dc666553f0f271eeee1491bca8988b71b4de737b17c21b'

    await request(app)
      .post('/users/login')
      .send({ data, signature })
      .expect(400)
  })

  it('login fails on old timestamp', async function () {
    await createStarterCNodeUser()
    const ts = Math.round((new Date()).getTime() / 1000) - 305
    const data = 'This is a message:' + ts.toString()
    const signature = sigUtil.personalSign(Buffer.from(testEthereumConstants.privKeyHex, 'hex'), { data })
    await request(app)
      .post('/users/login')
      .send({ data, signature })
      .expect(400)
  })

  it('logout works', async function () {
    const session = await createStarterCNodeUser()
    await request(app)
      .post('/users/logout')
      .set('X-Session-ID', session)
      .send({})
      .expect(200)
    await request(app)
      .post('/users/logout')
      .set('X-Session-ID', session)
      .send({})
      .expect(401)
  })
})
