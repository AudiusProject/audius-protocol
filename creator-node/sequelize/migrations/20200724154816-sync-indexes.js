'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('CNodeUsers', ['cnodeUserUUID'], {
      name: 'cnodeUsers_cnodeuserUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('Tracks', ['trackUUID'], {
      name: 'track_trackUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('Tracks', ['metadataFileUUID'], {
      name: 'track_metadataFileUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('Tracks', ['coverArtFileUUID'], {
      name: 'track_coverArtFileUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('AudiusUsers', ['metadataFileUUID'], {
      name: 'audiusUsers_metadataFileUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('AudiusUsers', ['coverArtFileUUID'], {
      name: 'audiusUsers_coverArtFileUUID_idx',
      using: 'btree',
      concurrently: true
    })

    await queryInterface.addIndex('AudiusUsers', ['profilePicFileUUID'], {
      name: 'audiusUsers_profilePicFileUUID_idx',
      using: 'btree',
      concurrently: true
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('CNodeUsers', 'cnodeUsers_cnodeuserUUID_idx')
    await queryInterface.removeIndex('Tracks', 'track_trackUUID_idx')
    await queryInterface.removeIndex('Tracks', 'track_metadataFileUUID_idx')
    await queryInterface.removeIndex('Tracks', 'track_coverArtFileUUID_idx')
    await queryInterface.removeIndex('AudiusUsers', 'audiusUsers_metadataFileUUID_idx')
    await queryInterface.removeIndex('AudiusUsers', 'audiusUsers_coverArtFileUUID_idx')
    await queryInterface.removeIndex('AudiusUsers', 'audiusUsers_profilePicFileUUID_idx')
  }
}
