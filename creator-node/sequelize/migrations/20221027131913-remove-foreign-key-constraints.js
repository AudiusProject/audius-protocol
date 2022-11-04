'use strict'
module.exports = {
  up: async (queryInterface, _Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    console.log(
      'STARTING MIGRATION 20221027131913-remove-foreign-key-constraints'
    )

    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "AudiusUsers" DROP CONSTRAINT IF EXISTS "AudiusUsers_coverArtFileUUID_fkey";`,
      { transaction }
    )

    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "AudiusUsers" DROP CONSTRAINT IF EXISTS "AudiusUsers_metadataFileUUID_fkey";`,
      { transaction }
    )

    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "AudiusUsers" DROP CONSTRAINT IF EXISTS "AudiusUsers_profilePicFileUUID_fkey";`,
      { transaction }
    )

    await queryInterface.sequelize.query(
      // This trailing space is intentional because the constraint was created with a trailing space in its name
      `ALTER TABLE IF EXISTS "Tracks" DROP CONSTRAINT IF EXISTS "Tracks_coverArtFileUUID_fkey ";`,
      { transaction }
    )

    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "Tracks" DROP CONSTRAINT IF EXISTS "Tracks_metadataFileUUID_fkey";`,
      { transaction }
    )
    await transaction.commit()
    console.log(
      'FINISHED MIGRATION 20221027131913-remove-foreign-key-constraints'
    )
  },

  down: async (_queryInterface, _Sequelize) => {
    // Don't run down. To revert, just run the migration that originally created these constraints.
    // I.e., 20200922131913-post_vector_clock_db_migrations
  }
}
