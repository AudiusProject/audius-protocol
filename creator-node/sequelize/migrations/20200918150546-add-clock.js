'use strict'

/**
 * Content Tables = AudiusUsers, Tracks, Files
 * CNodeUsers Table considered a Reference Table only
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('STARTING MIGRATION 20200918150546-add-clock')
    const transaction = await queryInterface.sequelize.transaction()

    // Add 'clock' column to all 4 tables
    await addClockColumn(queryInterface, Sequelize, transaction)

    // Create Clock table
    await createClockRecordsTable(queryInterface, Sequelize, transaction)

    // Add composite unique constraint on (blockchainId, clock) to AudiusUsers and Tracks
    // Add composite unique constraint on (cnodeUserUUID, clock) to Files
    await addCompositeUniqueConstraints(queryInterface, Sequelize, transaction)

    await transaction.commit()
    console.log('FINISHED MIGRATION 20200918150546-add-clock')
  },

  down: async (queryInterface, Sequelize) => { }
}

async function addClockColumn (queryInterface, Sequelize, transaction) {
  await queryInterface.addColumn('CNodeUsers', 'clock', {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true
  }, { transaction })
  await queryInterface.addColumn('AudiusUsers', 'clock', {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true
  }, { transaction })
  await queryInterface.addColumn('Tracks', 'clock', {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true
  }, { transaction })
  await queryInterface.addColumn('Files', 'clock', {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true
  }, { transaction })
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
      unique: false,
      allowNull: false
    },
    sourceTable: {
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
