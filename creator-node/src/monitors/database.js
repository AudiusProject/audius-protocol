const { sequelize } = require('../models')

const getDatabaseSize = async () => {
  const size = await sequelize.query(`SELECT pg_database_size(current_database())`)
  return size[0][0]['pg_database_size']
}

module.exports = {
  getDatabaseSize
}
