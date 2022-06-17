'use strict'
const models = require('../../src/models')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`ALTER TYPE "enum_Notifications_type" ADD VALUE 'AddTrackToPlaylist'`)
      await queryInterface.addColumn('Notifications', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true
      },
      { transaction })
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Drop old ENUM
      await models.Notification.destroy({
        where: { type: { [models.Sequelize.Op.in]: ['AddTrackToPlaylist'] } }
      })
      await queryInterface.removeColumn('Notifications', 'metadata')
    })
  }
}
