'use strict';

/**
 * Create index on "Files" ("cnodeUserUUID", "multihash", "clock")
 * Used to speed up DBManager.fetchFilesHashFromDB() and DBManager.fetchFilesHashesFromDB()
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "Files_cnodeUserUUID_multihash_clock_idx"
      ON public."Files"
      USING btree
      ("cnodeUserUUID", "multihash", "clock")
    `)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CNodeUsers', 'filesHash')
  }
};
