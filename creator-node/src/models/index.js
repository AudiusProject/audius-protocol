'use strict'

const start = Date.now()

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

const globalConfig = require('../config')

const basename = path.basename(__filename)
const db = {}

console.log('startup profiling - models/index.js - before sequelize init', Math.floor((Date.now() - start) / 1000))

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

console.log('startup profiling - models/index.js - after sequelize init', Math.floor((Date.now() - start) / 1000))

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
