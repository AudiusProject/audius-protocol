'use strict'

const fs = require('fs-extra')
const path = require('path')
const Sequelize = require('sequelize')

const config = require('../config')
const { clusterUtils } = require('../utils/clusterUtils')

const basename = path.basename(__filename)
const db = {}

const QUERY_TIMEOUT = 100 * 60 * 10 // 10 minutes

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
    options: {
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
