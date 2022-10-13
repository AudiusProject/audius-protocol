'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Files', 'isPremium', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "Files_isPremium_idx" ON "Files" USING btree ("isPremium")
    `)
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Files', 'Files_isPremium_idx')
    await queryInterface.removeColumn('Files', 'isPremium')
  }
};
