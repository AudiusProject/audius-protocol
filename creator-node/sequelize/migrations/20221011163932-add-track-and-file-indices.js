'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "Files_type_idx" ON "Files" USING btree ("type")
    `)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "Tracks_blockchainId_idx" ON "Tracks" USING btree ("blockchainId")
    `)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "Tracks_metadataJSON_is_premium_idx" ON "Tracks" USING btree ("metadataJSON" ->> 'is_premium')
    `)
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Files', 'Files_type_idx')
    await queryInterface.removeIndex('Tracks', 'Tracks_blockchainId_idx')
    await queryInterface.removeIndex('Tracks', 'Tracks_metadataJSON_is_premium_idx')
  }
};
