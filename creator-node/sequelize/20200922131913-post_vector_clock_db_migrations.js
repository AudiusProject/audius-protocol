'use strict'

/**
 * 20200922131913-post_vector_clock_db_migrations
 *
 * SCOPE
 * - delete all data where clock is still null + update remaining to 0
 * - enforce clock non-null constraints
 * - add back in foreign key constraints from AudiusUsers and Tracks to Files
 * - Add composite primary keys on (cnodeUserUUID,clock) to Tracks and AudiusUsers tables
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    console.log('STARTING MIGRATION')

    // delete all data from DataTables where clock is still null + update remaining cnodeUsers clocks to 0
    await queryInterface.sequelize.query(`
      DELETE FROM "AudiusUsers" WHERE "clock" IS NULL;
      DELETE FROM "Tracks" WHERE "clock" IS NULL;
      DELETE FROM "Files" WHERE "clock" IS NULL;
      UPDATE "CNodeUsers" SET "clock" = 0 WHERE "clock" IS NULL;
    `, { transaction })

    await enforceClockNonNullConstraints(queryInterface, Sequelize, transaction)

    // add back in foreign key constraints from AudiusUsers and Tracks to Files
    await queryInterface.sequelize.query(`
      ALTER TABLE "AudiusUsers" ADD CONSTRAINT "AudiusUsers_coverArtFileUUID_fkey" FOREIGN KEY ("coverArtFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "AudiusUsers" ADD CONSTRAINT "AudiusUsers_metadataFileUUID_fkey" FOREIGN KEY ("metadataFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "AudiusUsers" ADD CONSTRAINT "AudiusUsers_profilePicFileUUID_fkey" FOREIGN KEY ("profilePicFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "Tracks" ADD CONSTRAINT "Tracks_coverArtFileUUID_fkey " FOREIGN KEY ("coverArtFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "Tracks" ADD CONSTRAINT "Tracks_metadataFileUUID_fkey" FOREIGN KEY ("metadataFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
    `, { transaction })

    // Add composite primary keys on (cnodeUserUUID,clock) to Tracks and AudiusUsers tables
    // - (Files already has PK on fileUUID and cnodeUsers already has PK on cnodeUserUUID)
    await addCompositePrimaryKeysToAudiusUsersAndTracks(queryInterface, Sequelize, transaction)

    /**
     * TODO - enforce composite foreign key (cnodeUserUUID, clock) on all SourceTables
     *  - https://stackoverflow.com/questions/9984022/postgres-fk-referencing-composite-pk
     */

    await transaction.commit()
  },

  /** TODO */
  down: async (queryInterface, Sequelize) => {

  }
}

async function enforceClockNonNullConstraints (queryInterface, Sequelize, transaction) {
  await queryInterface.changeColumn('CNodeUsers', 'clock', {
    type: Sequelize.INTEGER,
    allowNull: false
  }, { transaction })
  await queryInterface.changeColumn('AudiusUsers', 'clock', {
    type: Sequelize.INTEGER,
    allowNull: false
  }, { transaction })
  await queryInterface.changeColumn('Tracks', 'clock', {
    type: Sequelize.INTEGER,
    allowNull: false
  }, { transaction })
  await queryInterface.changeColumn('Files', 'clock', {
    type: Sequelize.INTEGER,
    allowNull: false
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
