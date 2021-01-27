const { sequelize } = require('../models')

const getDatabaseSize = async () => {
  const size = await sequelize.query(`SELECT pg_database_size(current_database())`)
  return size[0][0].pg_database_size
}

const getDatabaseConnections = async () => {
  const connections = await sequelize.query("SELECT numbackends from pg_stat_database where datname = current_database()")
  return connections[0][0].numbackends
}

module.exports = {
  getDatabaseSize,
  getDatabaseConnections
}
