'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Files', ['multihash'], {
      name: 'ss_Files_multihash_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('AudiusUsers', ['cnodeUserUUID'], {
      name: 'ss_AudiusUsers_cnodeUserUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('Tracks', ['cnodeUserUUID'], {
      name: 'ss_Tracks_cnodeUserUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('Files', ['cnodeUserUUID'], {
      name: 'ss_Files_cnodeUserUUID_idx',
      using: 'btree',
      concurrently: true
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Files', 'ss_Files_multihash_idx')
    await queryInterface.removeIndex('AudiusUsers', 'ss_AudiusUsers_cnodeUserUUID_idx')
    await queryInterface.removeIndex('Tracks', 'ss_Tracks_cnodeUserUUID_idx')
    await queryInterface.removeIndex('Files', 'ss_Files_cnodeUserUUID_idx')
  }
}
