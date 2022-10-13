const config = require('../src/config')

describe('test postgres and sequelize', function () {
  let server, sandbox

  it('respects the query timeout', async function () {
    config.set('queryTimeout', 1) // set the query timeout to be 1 milliseond
    const { sequelize } = require('../src/models')

    await sequelize.query(`
        SELECT *
        FROM some_table
    `)
  })
})
