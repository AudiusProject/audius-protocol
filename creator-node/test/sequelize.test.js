const proxyquire = require('proxyquire')
const chai = require('chai')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

const config = require('../src/config')

describe('test postgres and sequelize', function () {
  it('respects the query timeout', async function () {
    // set the query timeout to be 1 milliseond
    const sequelizeStatementTimeout = 1
    config.set('sequelizeStatementTimeout', sequelizeStatementTimeout)

    const { sequelize } = proxyquire('../src/models', {
      '../config': config
    })

    await expect(
      sequelize.query(
        `SELECT pg_sleep(60);`
      )
    ).to.eventually.be.rejectedWith(
      'canceling statement due to statement timeout'
    )
  })
})
