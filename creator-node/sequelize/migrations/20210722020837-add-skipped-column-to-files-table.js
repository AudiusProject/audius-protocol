'use strict'

/**
 * 1) Add boolean `skipped` column to Files table, defaulted to false
 * 2) Add index to new `skipped` column
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      BEGIN;
      ALTER TABLE "Files" ADD COLUMN IF NOT EXISTS "skipped" BOOLEAN NOT NULL DEFAULT FALSE;
      CREATE INDEX IF NOT EXISTS "Files_skipped_idx" ON "Files" USING btree ("skipped");
      COMMIT;
    `)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Files', 'skipped')
  }
}
