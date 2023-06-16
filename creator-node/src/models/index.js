'use strict'

const fs = require('fs-extra')
const path = require('path')
const Sequelize = require('sequelize')

const config = require('../config')

const basename = path.basename(__filename)
const db = {}

const STATEMENT_TIMEOUT = config.get('sequelizeStatementTimeout')

/**
 * https://github.com/sequelize/sequelize/blob/v4/lib/dialects/postgres/connection-manager.js
 *
 * NOTE: whenever we upgrade to higher sequelize version, we should revisit the docs as more dialectOptions have been added
 */

const sequelize = new Sequelize(config.get('dbUrl'), {
  logging: config.get('printSequelizeLogs'),
  operatorsAliases: false,
  pool: {
    max: config.get('dbConnectionPoolMax'),
    min: 5,
    acquire: 60000,
    idle: 10000
  },
  dialectOptions: {
    // number of milliseconds before a statement in query will time out, default is no timeout
    statement_timeout: STATEMENT_TIMEOUT
  }
})

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    )
  })
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
