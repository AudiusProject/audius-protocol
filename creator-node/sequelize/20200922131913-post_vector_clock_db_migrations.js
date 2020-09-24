'use strict'

/**
 * 20200922131913-post_vector_clock_db_migrations
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    await queryInterface.sequelize.query(`
      DELETE FROM "AudiusUsers" WHERE "clock" IS NULL;
      DELETE FROM "Tracks" WHERE "clock" IS NULL;
      DELETE FROM "Files" WHERE "clock" IS NULL;
      UPDATE "CNodeUsers" SET "clock" = 0 WHERE "clock" IS NULL;
    `)

    await updateClock(queryInterface, Sequelize, transaction, false)

    // add back in foreign key constraints for AudiusUsers and Tracks
    await queryInterface.sequelize.query(`
      ALTER TABLE "AudiusUsers" ADD CONSTRAINT "AudiusUsers_coverArtFileUUID_fkey" FOREIGN KEY ("coverArtFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "AudiusUsers" ADD CONSTRAINT "AudiusUsers_metadataFileUUID_fkey" FOREIGN KEY ("metadataFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "AudiusUsers" ADD CONSTRAINT "AudiusUsers_profilePicFileUUID_fkey" FOREIGN KEY ("profilePicFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "Tracks" ADD CONSTRAINT "Tracks_coverArtFileUUID_fkey " FOREIGN KEY ("coverArtFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "Tracks" ADD CONSTRAINT "Tracks_metadataFileUUID_fkey" FOREIGN KEY ("metadataFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
    `)

    // Add composite primary keys on (cnodeUserUUID,clock) to Tracks and AudiusUsers tables
    // (Files already has PK on fileUUID and cnodeUsers already has PK on cnodeUserUUID)
    await addCompositePrimaryKeysToAudiusUsersAndTracks(queryInterface, Sequelize, transaction)

    await transaction.commit()
  },

  // TODO
  down: async (queryInterface, Sequelize) => {

  }
}

async function updateClock (queryInterface, Sequelize, transaction, allowNull) {
  await queryInterface.changeColumn('CNodeUsers', 'clock', {
    type: Sequelize.INTEGER,
    allowNull
  }, { transaction })
  await queryInterface.changeColumn('AudiusUsers', 'clock', {
    type: Sequelize.INTEGER,
    allowNull
  }, { transaction })
  await queryInterface.changeColumn('Tracks', 'clock', {
    type: Sequelize.INTEGER,
    allowNull
  }, { transaction })
  await queryInterface.changeColumn('Files', 'clock', {
    type: Sequelize.INTEGER,
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
