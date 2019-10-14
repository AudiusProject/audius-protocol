'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Files', ['multihash'], {
      name: 'Files_multihash_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('AudiusUsers', ['cnodeUserUUID'], {
      name: 'AudiusUsers_cnodeUserUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('Tracks', ['cnodeUserUUID'], {
      name: 'Tracks_cnodeUserUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('Files', ['cnodeUserUUID'], {
      name: 'Files_cnodeUserUUID_idx',
      using: 'btree',
      concurrently: true
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Files', 'Files_multihash_idx')
    await queryInterface.removeIndex('AudiusUsers', 'AudiusUsers_cnodeUserUUID_idx')
    await queryInterface.removeIndex('Tracks', 'Tracks_cnodeUserUUID_idx')
    await queryInterface.removeIndex('Files', 'Files_cnodeUserUUID_idx')
  }
}
