'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Files', ['trackUUID'], {
      name: 'files_track_uuid_index',
      using: 'btree',
      concurrently: true
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Files', 'files_track_uuid_index')
  }
}
