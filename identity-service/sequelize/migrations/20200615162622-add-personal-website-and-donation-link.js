'use strict'

/**
 * Adds a 'count' field to UserTrackListens, which signifies the
 * number of times a user has listened to a track
 */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('SocialHandles', 'website', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction })
      await queryInterface.addColumn('SocialHandles', 'donation', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction })
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      queryInterface.removeColumn('SocialHandles', 'website')
      queryInterface.removeColumn('SocialHandles', 'donation')
    })
  }
}
