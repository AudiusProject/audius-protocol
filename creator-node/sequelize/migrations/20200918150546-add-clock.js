'use strict'

/**
 * Content Tables = AudiusUsers, Tracks, Files
 * CNodeUsers Table considered a Reference Table only
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    // Add 'clock' column to all 4 tables
    await addClockColumn(queryInterface, Sequelize, transaction, true)

    // Create Clock table
    await createClockRecordsTable(queryInterface, Sequelize, transaction)

    // Add composite unique constraint on (blockchainId, clock) to AudiusUsers and Tracks
    // Add composite unique constraint on (cnodeUserUUID, clock) to Files
    await addCompositeUniqueConstraints(queryInterface, Sequelize, transaction)

    // Add composite primary keys on (cnodeUserUUID,clock) to Tracks and AudiusUsers tables
    // (Files already has PK on fileUUID and cnodeUsers already has PK on cnodeUserUUID)
    // await addCompositePrimaryKeysToAudiusUsersAndTracks(queryInterface, Sequelize, transaction)

    await transaction.commit()
  },

  // TODO
  down: async (queryInterface, Sequelize) => {
    // Remove uniqueness constraints on (cnodeUserUUID, clock) on all 4 tables
    await queryInterface.removeConstraint(
      'CNodeUsers',
      'CNodeUsers_unique_constraint_(cnodeUserUUID,clock)'
    )
    await queryInterface.removeConstraint(
      'AudiusUsers',
      'AudiusUsers_unique_constraint_(cnodeUserUUID,clock)'
    )
    await queryInterface.removeConstraint(
      'Tracks',
      'Tracks_unique_constraint_(cnodeUserUUID,clock)'
    )

    // Remove clock columns on all 4 tables
    await queryInterface.removeColumn('CNodeUsers', 'clock')
    await queryInterface.removeColumn('AudiusUsers', 'clock')
    await queryInterface.removeColumn('Tracks', 'clock')
    await queryInterface.removeColumn('Files', 'clock')
  }
}

async function addClockColumn (queryInterface, Sequelize, transaction, allowNull) {
  await queryInterface.addColumn('CNodeUsers', 'clock', {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull
  }, { transaction })
  await queryInterface.addColumn('AudiusUsers', 'clock', {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull
  }, { transaction })
  await queryInterface.addColumn('Tracks', 'clock', {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull
  }, { transaction })
  await queryInterface.addColumn('Files', 'clock', {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull
  }, { transaction })
}

async function addCompositePrimaryKeysToAudiusUsersAndTracks (queryInterface, Sequelize, transaction) {
  await queryInterface.addConstraint(
    'AudiusUsers',
    {
      type: 'PRIMARY KEY',
      fields: ['cnodeUserUUID', 'clock'],
      name: 'AudiusUsers_primary_key_(cnodeUserUUID,clock)',
      transaction
    }
  )
  await queryInterface.addConstraint(
    'Tracks',
    {
      type: 'PRIMARY KEY',
      fields: ['cnodeUserUUID', 'clock'],
      name: 'Tracks_primary_key_(cnodeUserUUID,clock)',
      transaction
    }
  )
}

async function addCompositeUniqueConstraints (queryInterface, Sequelize, transaction) {
  await queryInterface.addConstraint(
    'AudiusUsers',
    {
      type: 'UNIQUE',
      fields: ['blockchainId', 'clock'],
      name: 'AudiusUsers_unique_(blockchainId,clock)',
      transaction
    }
  )
  await queryInterface.addConstraint(
    'Tracks',
    {
      type: 'UNIQUE',
      fields: ['blockchainId', 'clock'],
      name: 'Tracks_unique_(blockchainId,clock)',
      transaction
    }
  )
  await queryInterface.addConstraint(
    'Files',
    {
      type: 'UNIQUE',
      fields: ['cnodeUserUUID', 'clock'],
      name: 'Files_unique_(cnodeUserUUID,clock)',
      transaction
    }
  )
}

async function createClockRecordsTable (queryInterface, Sequelize, transaction) {
  await queryInterface.createTable('ClockRecords', {
    cnodeUserUUID: {
      type: Sequelize.UUID,
      primaryKey: true, // composite PK with clock
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
      primaryKey: true, // composite PK with cnodeUserUUID
      unique: false,
      allowNull: false
    },
    sourceTable: {
      // TODO - if this doesn't work, use models/file.js:L46
      type: Sequelize.ENUM('AudiusUser', 'Track', 'File'),
      allowNull: false
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
