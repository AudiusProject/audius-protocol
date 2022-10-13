'use strict'

const fs = require('fs-extra')
const path = require('path')
const Sequelize = require('sequelize')

const config = require('../config')
const { clusterUtils } = require('../utils/clusterUtils')

const basename = path.basename(__filename)
const db = {}

const QUERY_TIMEOUT = config.get('queryTimeout')

const sequelize = new Sequelize(config.get('dbUrl'), {
  logging: config.get('printSequelizeLogs'),
  operatorsAliases: false,
  pool: {
    max: config.get('dbConnectionPoolMax') / clusterUtils.getNumWorkers(),
    min: 5,
    acquire: 60000,
    idle: 10000
  },
  dialectOptions: {
    // number of milliseconds before a statement in query will time out, default is no timeout
    // statement_timeout: 1000,

    // number of milliseconds before a query call will timeout, default is no timeout
    query_timeout: QUERY_TIMEOUT,

    // number of milliseconds to wait for connection, default is no timeout
    // connectionTimeoutMillis: 1000

    // number of milliseconds before terminating any session with an open idle transaction, default is no timeout
    // idle_in_transaction_session_timeout: 1000
    options: {
      // Request to server timeout
      requestTimeout: QUERY_TIMEOUT
    }
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
