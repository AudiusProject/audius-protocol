const request = require('supertest')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

describe('test AudiusUsers', function () {
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

  it('creates Audius user', function (done) {
    const metadata = {
      test: 'field1'
    }
    ipfsMock.add.twice().withArgs(Buffer.from(JSON.stringify(metadata)))
    ipfsMock.pin.add.once().withArgs('testCIDLink')

    request(app)
      .post('/audius_users')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        if (res.body.metadataMultihash !== 'testCIDLink') {
          return done(new Error('invalid return data'))
        }
        done()
      })
  })

  it('completes Audius user creation', function (done) {
    const metadata = {
      test: 'field1'
    }
    ipfsMock.add.twice().withArgs(Buffer.from(JSON.stringify(metadata)))
    ipfsMock.pin.add.once().withArgs('testCIDLink')

    request(app)
      .post('/audius_users')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        if (res.body.metadataMultihash !== 'testCIDLink') {
          return done(new Error('invalid return data'))
        }

        request(app)
          .post(`/audius_users/associate/${res.body.id}`)
          .set('X-Session-ID', session)
          .send({ userId: 5, blockNumber: 20 })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            done()
          })
      })
  })
})
