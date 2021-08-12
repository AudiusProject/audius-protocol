'use strict'

/**
 * 1) Add boolean `skipped` column to Files table, defaulted to false
 * 2) Add index to new `skipped` column
 */

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
