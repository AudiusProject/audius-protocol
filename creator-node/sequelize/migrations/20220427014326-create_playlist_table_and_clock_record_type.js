'use strict'

/**
 * New table - Playlist
 * New enum value for clock records sourceTable, Playlist
 * CNodeUsers Table considered a Reference Table only
 */

const tableName = 'Playlists'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    // Create Playlist table
    await createPlaylistTable(queryInterface, Sequelize, transaction)
    await addPlaylistToClockRecordSourceTables(queryInterface, transaction)

    // Add composite unique constraint on (blockchainId, clock) to Playlist
    await addCompositeUniqueConstraints(queryInterface, transaction)

    await transaction.commit()
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const transaction = await queryInterface.sequelize.transaction()
      await removeCompositeUniqueConstraints(queryInterface, transaction)
      await removePlaylistFromClockRecordSourceTables(
        queryInterface,
        transaction
      )
      await dropPlaylistTable(queryInterface, transaction)
      await transaction.commit()
    } catch (e) {
      console.log(e)
    }
  }
}

async function addPlaylistToClockRecordSourceTables(queryInterface) {
  // Note that this cannot be run inside a transaction block
  await queryInterface.sequelize.query(
    `ALTER TYPE "enum_ClockRecords_sourceTable" ADD VALUE IF NOT EXISTS 'Playlist'`
  )
}

async function removePlaylistFromClockRecordSourceTables(
  queryInterface,
  transaction
) {
  await queryInterface.sequelize.query(
    `
  ALTER TYPE "enum_ClockRecords_sourceTable" RENAME TO "enum_ClockRecords_sourceTable_old";
  CREATE TYPE "enum_ClockRecords_sourceTable" AS ENUM('AudiusUser', 'Track', 'File');
  ALTER TABLE "ClockRecords" ALTER COLUMN "sourceTable" TYPE "enum_ClockRecords_sourceTable" USING "sourceTable"::text::"enum_ClockRecords_sourceTable";
  DROP TYPE "enum_ClockRecords_sourceTable_old";
  `,
    { transaction }
  )
}

async function addCompositeUniqueConstraints(queryInterface, transaction) {
  await queryInterface.addConstraint(tableName, {
    type: 'UNIQUE',
    fields: ['blockchainId', 'clock'],
    name: 'Playlist_unique_(blockchainId,clock)',
    transaction
  })
}

async function removeCompositeUniqueConstraints(queryInterface, transaction) {
  try {
    await queryInterface.removeConstraint(
      tableName,
      'Playlist_unique_(blockchainId,clock)',
      { transaction }
    )
  } catch (e) {
    console.log(e)
  }
}

async function createPlaylistTable(queryInterface, Sequelize, transaction) {
  await queryInterface.createTable(
    tableName,
    {
      cnodeUserUUID: {
        type: Sequelize.UUID,
        primaryKey: true, // composite primary key (cnodeUserUUID, clock)
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
        unique: 'compositeIndex',
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
      blockchainId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: false,
        unique: 'compositeIndex',
        onDelete: 'RESTRICT'
      },
      playlistImageFileUUID: {
        type: Sequelize.UUID,
        allowNull: true,
        onDelete: 'RESTRICT',
        references: {
          model: 'Files',
          key: 'fileUUID',
          as: 'playlistImageFileUUID'
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
    },
    {
      transaction
    }
  )
}

async function dropPlaylistTable(queryInterface, transaction) {
  await queryInterface.dropTable(tableName, {
    transaction
  })
}
