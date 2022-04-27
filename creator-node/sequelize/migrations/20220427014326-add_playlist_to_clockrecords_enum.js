'use strict'

/**
 * New table - Playlist
 * CNodeUsers Table considered a Reference Table only
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('STARTING MIGRATION 20220427014326-add_playlist_to_clockrecords_enum')
    const transaction = await queryInterface.sequelize.transaction()
    
    // Create Playlist table
    await createPlaylistTable(queryInterface, Sequelize, transaction)

    await addPlaylistToClockRecordSourceTables(queryInterface, Sequelize, transaction)
    
    // Add composite unique constraint on (playlistId, clock) to Playlist
    await addCompositeUniqueConstraints(queryInterface, Sequelize, transaction)

    await transaction.commit()
    console.log('FINISHED MIGRATION add_playlist_to_clockrecords_enum')
  },

  down: async (queryInterface, Sequelize) => {/* TODO */ }
}

async function addPlaylistToClockRecordSourceTables(queryInterface, Sequelize, transaction) {
  await queryInterface.sequelize.query(`ALTER TYPE "enum_ClockRecords_sourceTable" ADD VALUE 'Playlist'`);

}

async function addCompositeUniqueConstraints (queryInterface, Sequelize, transaction) {
  await queryInterface.addConstraint(
    'Playlist',
    {
      type: 'UNIQUE',
      fields: ['playlistId', 'clock'],
      name: 'Playlist_unique_(playlistId,clock)',
      transaction
    }
  )
}

async function createPlaylistTable (queryInterface, Sequelize, transaction) {
  await queryInterface.createTable('Playlist', {
    cnodeUserUUID: {
      type: Sequelize.UUID,
      primaryKey: false,
      unique: false,
      allowNull: false,
      references: {
        model: 'CNodeUsers',
        key: 'cnodeUserUUID',
        as: 'cnodeUserUUID'
      },
      onDelete: 'RESTRICT'
    },
    clock: {
      type: Sequelize.INTEGER,
      primaryKey: true, // composite primary key (cnodeUserUUID, clock)
      unique: false,
      allowNull: false
    },
    metadataFileUUID: {
      type: Sequelize.UUID,
      allowNull: false,
      onDelete: 'RESTRICT',
      references: {
        model: 'Files',
        key: 'fileUUID',
        as: 'metadataFileUUID'
      }
    },
    metadataJSON: {
      type: Sequelize.JSONB,
      allowNull: false
    },
    playlistId: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true, // composite primary key (playlistId, clock)
      unique: true,
      onDelete: 'RESTRICT'
    },
    coverArtFileUUID: {
      type: Sequelize.UUID,
      allowNull: true,
      onDelete: 'RESTRICT',
      references: {
        model: 'Files',
        key: 'fileUUID',
        as: 'coverArtFileUUID'
      }
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  }, { transaction })
}
