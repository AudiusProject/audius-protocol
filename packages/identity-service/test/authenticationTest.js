const request = require('supertest')
const assert = require('assert')

const { getApp } = require('./lib/app')

describe('test authentication routes', function () {
  let app, server
  beforeEach(async () => {
    const appInfo = await getApp()
    app = appInfo.app
    server = appInfo.server
  })
  afterEach(async () => {
    await server.close()
  })

  it('responds 400 for sign up with incorrect body', function (done) {
    request(app)
      .post('/authentication')
      .send({
        iv: 'a7407b91ccb1a09a270e79296c88a990',
        cipherText:
          '00b1684fe58f95ef7bca1442681a61b8aa817a136d3c932dcee2bdcb59454205b73174e71b39fa1d532ee915b6d4ba24e8487603fa63e738de35d3505085a142'
      })
      .expect(400, done)
  })

  it('responds 200 for sign up with correct body', function (done) {
    request(app)
      .post('/authentication')
      .send({
        iv: 'a7407b91ccb1a09a270e79296c88a990',
        cipherText:
          '00b1684fe58f95ef7bca1442681a61b8aa817a136d3c932dcee2bdcb59454205b73174e71b39fa1d532ee915b6d4ba24e8487603fa63e738de35d3505085a142',
        lookupKey:
          '9bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77'
      })
      .expect(200, done)
  })

  it('changes passwords for the user', async function () {
    await request(app)
      .post('/authentication')
      .send({
        iv: 'a7407b91ccb1a09a270e79296c88a990',
        cipherText:
          '00b1684fe58f95ef7bca1442681a61b8aa817a136d3c932dcee2bdcb59454205b73174e71b39fa1d532ee915b6d4ba24e8487603fa63e738de35d3505085a142',
        lookupKey:
          '9bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77'
      })
      .expect(200)

    await request(app)
      .post('/authentication')
      .send({
        iv: 'b7407b91ccb1a09a270e79296c88a990',
        cipherText:
          '10b1684fe58f95ef7bca1442681a61b8aa817a136d3c932dcee2bdcb59454205b73174e71b39fa1d532ee915b6d4ba24e8487603fa63e738de35d3505085a142',
        lookupKey:
          '1bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77',
        oldLookupKey:
          '9bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77'
      })
      .expect(200)

    const redis = app.get('redis')
    redis.set('otp:dheeraj@audius.co', '123456')
    // old lookup key doesn't work
    await request(app)
      .get('/authentication')
      .query({
        lookupKey:
          '9bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77',
        email: 'dheeraj@audius.co',
        otp: '123456'
      })
      .expect(400)

    // New lookup key works
    await request(app)
      .get('/authentication')
      .query({
        lookupKey:
          '1bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77',
        email: 'dheeraj@audius.co',
        otp: '123456'
      })
      .expect(200)

    // Change back
    await request(app)
      .post('/authentication')
      .send({
        iv: 'b7407b91ccb1a09a270e79296c88a990',
        cipherText:
          '10b1684fe58f95ef7bca1442681a61b8aa817a136d3c932dcee2bdcb59454205b73174e71b39fa1d532ee915b6d4ba24e8487603fa63e738de35d3505085a142',
        lookupKey:
          '9bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77',
        oldLookupKey:
          '1bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77'
      })
      .expect(200)

    // old lookup key doesn't work
    await request(app)
      .get('/authentication')
      .query({
        lookupKey:
          '1bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77',
        email: 'dheeraj@audius.co',
        otp: '123456'
      })
      .expect(400)

    // New lookup key works
    await request(app)
      .get('/authentication')
      .query({
        lookupKey:
          '9bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77',
        email: 'dheeraj@audius.co',
        otp: '123456'
      })
      .expect(200)
  })

  it('responds 400 for lookup authentication with invalid lookupKey', function (done) {
    // Try getting data without the correct query params, should fail
    request(app)
      .get('/authentication')
      .query({
        lookupKey:
          '9bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77'
      })
      .expect(400, done)
  })

  it('responds 200 for lookup authentication with correct params', async function () {
    // First, create some data in the db
    await request(app).post('/authentication').send({
      iv: 'a7407b91ccb1a09a270e79296c88a990',
      cipherText:
        '00b1684fe58f95ef7bca1442681a61b8aa817a136d3c932dcee2bdcb59454205b73174e71b39fa1d532ee915b6d4ba24e8487603fa63e738de35d3505085a142',
      lookupKey:
        '9bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77'
    })

    await request(app).post('/user').send({
      username: 'dheeraj@audius.co',
      walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaa'
    })

    const redis = app.get('redis')
    redis.set('otp:dheeraj@audius.co', '123456')
    // Try getting data with the right params
    const response = await request(app).get('/authentication').query({
      lookupKey:
        '9bdc91e1bb7ef60177131690b18349625778c14656dc17814945b52a3f07ac77',
      email: 'dheeraj@audius.co',
      otp: '123456'
    })

    assert.deepStrictEqual(response.statusCode, 200)
  })
})
