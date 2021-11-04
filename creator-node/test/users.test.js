const request = require('supertest')
const sigUtil = require('eth-sig-util')

const BlacklistManager = require('../src/blacklistManager')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser, createStarterCNodeUserWithKey, testEthereumConstants } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

describe('test Users', async function () {
  let app, server, ipfsMock, ipfsLatestMock, libsMock

  /** Setup app + global test vars */
  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    ipfsLatestMock = getIPFSMock(true)
    libsMock = getLibsMock()

    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager, ipfsLatestMock)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
  })

  afterEach(async () => {
    await server.close()
  })

  it('creates new user', async function () {
    request(app)
      .post('/users')
      .send({ walletAddress: testEthereumConstants.pubKey })
      .expect(200)
  })

  it('fails new user create on bad address', async function () {
    request(app)
      .post('/users')
      .send({ walletAddress: '0x123' })
      .expect(400)
  })

  it('user create is idempotent', async function () {
    await createStarterCNodeUser()
    await request(app)
      .post('/users')
      .send({ walletAddress: testEthereumConstants.pubKey })
      .expect(200)
  })

  it('fail to get challenge without wallet address', async function () {
    request(app)
      .get('/users/login/challenge')
      .expect(400)
  })

  it('get challenge with wallet address', async function () {
    await createStarterCNodeUser()
    await request(app)
      .get('/users/login/challenge')
      .query({ walletPublicKey: testEthereumConstants.pubKey })
      .expect(200)
  })

  it('fail using POST challenge route with missing body keys', async function () {
    await request(app)
      .post('/users/login/challenge')
      .send({ })
      .expect(400)
  })

  it('fail using POST challenge route with invalid data and signature', async function () {
    await request(app)
      .post('/users/login/challenge')
      .send({ data: 'data', signature: 'signature' })
      .expect(400)
  })

  it('fail using POST challenge route with no cnode user', async function () {
    let challengeResp
    await request(app)
      .get('/users/login/challenge')
      .query({ walletPublicKey: testEthereumConstants.pubKey })
      .expect(200)
      .then(response => {
        challengeResp = response.body
      })

    const signature = sigUtil.personalSign(Buffer.from(testEthereumConstants.privKeyHex, 'hex'), { data: challengeResp.challenge })

    await request(app)
      .post('/users/login/challenge')
      .send({ data: challengeResp.challenge, signature })
      .expect(400)
  })

  it('fail using POST challenge route with challenge key not present in redis', async function () {
    let challengeResp
    const randomPubKey = '0xadD36bad12002f1097Cdb7eE24085C28e9random'
    await createStarterCNodeUser()
    await createStarterCNodeUserWithKey(randomPubKey)
    await request(app)
      .get('/users/login/challenge')
      .query({ walletPublicKey: randomPubKey })
      .expect(200)
      .then(response => {
        challengeResp = response.body
      })

    const signature = sigUtil.personalSign(Buffer.from(testEthereumConstants.privKeyHex, 'hex'), { data: challengeResp.data.challenge })

    await request(app)
      .post('/users/login/challenge')
      .send({ data: challengeResp.data.challenge, signature })
      .expect(400)
  })

  it('fail to log user in with challenge key if used twice', async function () {
    let challengeResp
    await createStarterCNodeUser()
    await request(app)
      .get('/users/login/challenge')
      .query({ walletPublicKey: testEthereumConstants.pubKey })
      .expect(200)
      .then(response => {
        challengeResp = response.body
      })

    const signature = sigUtil.personalSign(Buffer.from(testEthereumConstants.privKeyHex, 'hex'), { data: challengeResp.data.challenge })

    await request(app)
      .post('/users/login/challenge')
      .send({ data: challengeResp.data.challenge, signature })
      .expect(200)

    await request(app)
      .post('/users/login/challenge')
      .send({ data: challengeResp.data.challenge, signature })
      .expect(400)
  })

  it('successfully log user in with challenge key using challenge routes', async function () {
    let challengeResp
    await createStarterCNodeUser()
    await request(app)
      .get('/users/login/challenge')
      .query({ walletPublicKey: testEthereumConstants.pubKey })
      .expect(200)
      .then(response => {
        challengeResp = response.body
      })

    const signature = sigUtil.personalSign(Buffer.from(testEthereumConstants.privKeyHex, 'hex'), { data: challengeResp.data.challenge })

    await request(app)
      .post('/users/login/challenge')
      .send({ data: challengeResp.data.challenge, signature })
      .expect(200)
  })

  it('logout works', async function () {
    const session = await createStarterCNodeUser()
    await request(app)
      .post('/users/logout')
      .set('X-Session-ID', session.sessionToken)
      .send({})
      .expect(200)
    await request(app)
      .post('/users/logout')
      .set('X-Session-ID', session.sessionToken)
      .send({})
      .expect(401)
  })

  it.skip('TODO - clock_status test', async function () {})
})
