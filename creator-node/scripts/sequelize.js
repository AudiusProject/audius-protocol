'use strict'

/**
 * This files allows scripts in the scripts/ folder to connect to the db instance via sequelize and
 * use models defined in the creator-node/src/models/ folder
 *
 * USAGE
 * 1. Set the env var `dbUrl` to your postgres instance
 * 2. In your script in the creator-node/scripts/ folder, require `const models = require('./sequelize')(process.env.dbUrl)`
 * 3. You can now use models exactly like it's used in the code in the src/ directory
 */
const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

module.exports = function (dbUrl) {
  const basename = 'index.js'
  const db = {}

  const modelsPath = path.join(__dirname, '../src/models')
  console.log(basename, modelsPath)

  const sequelize = new Sequelize(dbUrl, {
    logging: true,
    operatorsAliases: false,
    pool: {
      max: 100,
      min: 5,
      acquire: 60000,
      idle: 10000
    }
  })

  fs
    .readdirSync(modelsPath)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
    })
    .forEach(file => {
      const model = sequelize['import'](path.join(modelsPath, file))
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
