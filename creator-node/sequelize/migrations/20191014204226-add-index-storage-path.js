'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Files', ['storagePath'], {
      name: 'Files_storagePath_idx',
      using: 'btree',
      concurrently: true
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Files', 'Files_storagePath_idx')
  }
}
