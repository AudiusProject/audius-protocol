import fs from 'fs'
import path from 'path'
import Sequelize from 'sequelize'

const globalConfig = require('../config')

const basename = path.basename(__filename)
const db: {
  [name: string]: Sequelize.Model<unknown, unknown, unknown>
} = {}

const sequelize = new Sequelize(globalConfig.get('dbUrl'), {
  logging: false,
  operatorsAliases: false,
  pool: {
    max: globalConfig.get('pgConnectionPoolMax'),
    min: globalConfig.get('pgConnectionPoolMin'),
    acquire: globalConfig.get('pgConnectionPoolAcquireTimeout'),
    idle: globalConfig.get('pgConnectionPoolIdleTimeout')
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
    const model = db[modelName]
    model.associate(db)
  }
})

module.exports = {
  ...db,
  sequelize,
  Sequelize
}
