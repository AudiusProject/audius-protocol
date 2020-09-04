'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

const modelsDirName = path.resolve('../src/models')

const basename = path.basename('index.js')

const initDB = async (dbUrl) => {
  const db = {}

  const sequelize = new Sequelize(dbUrl, {
    logging: true,
    operatorsAliases: false,
    // dialectOptions: {
    //   idleTimeoutMillis: 500,
    //   connectionTimeoutMillis: 500
    // },
    pool: {
      max: 100,
      min: 5,
      acquire: 60000,
      idle: 10000
    }
  })
    
  fs
    .readdirSync(modelsDirName)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
    })
    .forEach(file => {
      const model = sequelize['import'](path.join(modelsDirName, file))
      db[model.name] = model
    })
  
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db)
    }
  })
  
  db.sequelize = sequelize
  db.Sequelize = Sequelize

  return db
}

module.exports = initDB
