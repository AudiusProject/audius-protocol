'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ContentBlacklists', {
      id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM('USER', 'TRACK'),
        primaryKey: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ContentBlacklists_type";'),
      queryInterface.dropTable('ContentBlacklists')
    ])
  }
}
