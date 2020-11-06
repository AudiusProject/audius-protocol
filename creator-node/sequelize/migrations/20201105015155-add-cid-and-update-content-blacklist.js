'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Remove primary key constraints on type and value
      await queryInterface.removeConstraint('ContentBlacklists', 'ContentBlacklists_pkey')

      // Rename colums id to value
      await queryInterface.renameColumn('ContentBlacklists', 'id', 'value')

      // Update column value properties
      await queryInterface.changeColumn('ContentBlacklists', 'value', {
        allowNull: false,
        type: Sequelize.TEXT,
        name: 'ContentBlacklist_value'
      })

      // Add new column id that will become the new primary key
      await queryInterface.addColumn('ContentBlacklists', 'id', {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      })

      // Column type will have an additional 'CID' enum value
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_ContentBlacklists_type" ADD VALUE \'CID\';'
      )

      // Add unique constraint on value and type as to not have dupes
      await queryInterface.addConstraint('ContentBlacklists', ['value', 'type'], {
        type: 'unique',
        name: 'ContentBlacklists_unique_constraint'
      })
    } catch (e) {
      throw e
    }
  },

  // todo: test down
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('ContentBlacklists', 'ContentBlacklists_pkey')
    await queryInterface.removeColumn('ContentBlacklists', 'id')
    await queryInterface.removeConstraint('ContentBlacklists', 'ContentBlacklists_unique_constraint')
    await queryInterface.renameColumn('ContentBlacklists', 'value', 'id')
    await queryInterface.changeColumn('ContentBlacklists', 'id', {
      allowNull: false,
      type: Sequelize.INTEGER,
      primaryKey: true
    })
    await queryInterface.sequelize.query('DELETE FROM "enum_ContentBlacklists_type" WHERE enumlabel=\'CID\'')
    await queryInterface.changeColumn('ContentBlacklists', 'type', {
      allowNull: false,
      type: Sequelize.ENUM('USER', 'TRACK'),
      primaryKey: true
    })
  }
}
