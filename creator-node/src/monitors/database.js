const { sequelize } = require('../models')

const getDatabaseLiveness = async () => {
  try {
    await sequelize.query('SELECT 1')
  } catch (e) {
    return false
  }
  return true
}

const getDatabaseSize = async () => {
  const size = await sequelize.query('SELECT pg_database_size(current_database())')
  return size[0][0].pg_database_size
}

const getDatabaseConnections = async () => {
  const connections = await sequelize.query('SELECT numbackends from pg_stat_database where datname = current_database()')
  return connections[0][0].numbackends
}

const getDatabaseConnectionInfo = async () => {
  const connectionInfo = await sequelize.query("select wait_event_type, wait_event, state, query from pg_stat_activity where datname = 'audius_creator_node'")
  return JSON.stringify(connectionInfo[0])
}

module.exports = {
  getDatabaseLiveness,
  getDatabaseSize,
  getDatabaseConnections,
  getDatabaseConnectionInfo
}
