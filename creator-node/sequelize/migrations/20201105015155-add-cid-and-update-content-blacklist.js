'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    const tableName = 'ContentBlacklists'
    const columnName = 'type'
    const previousEnumName = 'enum_ContentBlacklists_type'
    const newEnumName = 'enum_ContentBlacklists_type_new'
    const newValues = ['TRACK', 'USER', 'CID']

    try {
      // Remove primary key constraints on type and value
      await queryInterface.removeConstraint(tableName, 'ContentBlacklists_pkey', { transaction })

      // Rename colums id to value
      await queryInterface.renameColumn(tableName, 'id', 'value', { transaction })

      // Update column value properties
      await queryInterface.changeColumn(tableName, 'value', {
        allowNull: false,
        type: Sequelize.STRING
      }, { transaction })

      // Add new column id that will become the new primary key
      await queryInterface.addColumn(tableName, 'id', {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      }, { transaction })

      // Create new enum with additional 'CID'
      await queryInterface.sequelize.query(`
          CREATE TYPE "${newEnumName}"
            AS ENUM ('${newValues.join('\', \'')}')
        `, { transaction })
      // Change column type to the new ENUM TYPE
      await queryInterface.sequelize.query(`
      ALTER TABLE "${tableName}"
        ALTER COLUMN ${columnName}
          TYPE "${newEnumName}"
          USING ("${columnName}"::text::"${newEnumName}")
    `, { transaction })
      // Drop old ENUM
      await queryInterface.sequelize.query(`
      DROP TYPE "${previousEnumName}"
    `, { transaction })
      // Rename new ENUM name
      await queryInterface.sequelize.query(`
      ALTER TYPE "${newEnumName}"
        RENAME TO "${previousEnumName}"
    `, { transaction })

      // Add unique constraint on value and type as to not have dupes
      await queryInterface.addConstraint(tableName, {
        type: 'UNIQUE',
        fields: ['value', 'type'],
        name: 'ContentBlacklists_unique_constraint',
        transaction
      })

      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      console.log(JSON.stringify(e))
      throw e
    }
  },

  // IMPORTANT: running this will result in data loss for tracked segments! do not run this unless
  // you know what you are doing ! ! ! ! ! !
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    const tableName = 'ContentBlacklists'
    const columnName = 'type'
    const previousEnumName = 'enum_ContentBlacklists_type'
    const revertEnumName = 'enum_ContentBlacklists_type_revert'
    const prevValues = ['TRACK', 'USER']

    try {
      // Remove all entries with type 'CID'
      await queryInterface.sequelize.query(`DELETE FROM "${tableName}" WHERE "${columnName}"='CID'`, { transaction })

      await queryInterface.removeColumn(tableName, 'id', { transaction })
      await queryInterface.removeConstraint(tableName, 'ContentBlacklists_unique_constraint', { transaction })
      await queryInterface.renameColumn(tableName, 'value', 'id', { transaction })
      await queryInterface.changeColumn(tableName, 'id', {
        allowNull: false,
        type: 'INTEGER USING CAST("id" as INTEGER)',
        primaryKey: true
      }, { transaction })

      // Create new enum with additional 'CID'
      await queryInterface.sequelize.query(`
          CREATE TYPE "${revertEnumName}"
            AS ENUM ('${prevValues.join('\', \'')}')
        `, { transaction })
      // Change column type to the new ENUM TYPE
      await queryInterface.sequelize.query(`
      ALTER TABLE "${tableName}"
        ALTER COLUMN ${columnName}
          TYPE "${revertEnumName}"
          USING ("${columnName}"::text::"${revertEnumName}")
    `, { transaction })
      // Drop old ENUM$
      await queryInterface.sequelize.query(`
      DROP TYPE "${previousEnumName}"
    `, { transaction })
      // Rename new ENUM name
      await queryInterface.sequelize.query(`
      ALTER TYPE "${revertEnumName}"
        RENAME TO "${previousEnumName}"
    `, { transaction })

      await queryInterface.sequelize.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "ContentBlacklists_pkey" PRIMARY KEY ("type", "id");`, { transaction })
      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      console.log(JSON.stringify(e))
      throw e
    }
  }
}
