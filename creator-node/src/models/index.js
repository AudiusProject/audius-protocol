'use strict'

const fs = require('fs-extra')
const path = require('path')
const Sequelize = require('sequelize')

const globalConfig = require('../config')

const basename = path.basename(__filename)
const db = {}

const sequelize = new Sequelize(globalConfig.get('dbUrl'), {
  logging: globalConfig.get('printSequelizeLogs'),
  operatorsAliases: false,
  pool: {
    max: globalConfig.get('dbConnectionPoolMax'),
    min: 5,
    acquire: 60000,
    idle: 10000
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
