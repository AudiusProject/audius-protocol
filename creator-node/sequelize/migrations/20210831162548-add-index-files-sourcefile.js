'use strict';

/**
 * Adds index on Files table ("sourceFile")
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "Files_sourceFile_idx" ON "Files" USING btree ("sourceFile");
    `)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "Files_sourceFile_idx";
    `)
  }
};
