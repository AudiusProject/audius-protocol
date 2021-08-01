'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Files', 'skipped', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
    await queryInterface.addIndex('Files', ['skipped'], {
      name: 'Files_skipped_idx',
      using: 'btree',
      concurrently: true
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Files', 'skipped')
  }
}
