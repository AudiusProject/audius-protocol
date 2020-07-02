'use strict'

/**
 * Adds two columns to the `files` table
 * - fileName: the actual queryable source filename stripped of any prefixes
 * - dirMultihash: if the file is in an IPFS directory, the CID/multihash for the parent dir
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn(
        'Files',
        'fileName',
        {
          type: Sequelize.TEXT,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'Files',
        'dirMultihash',
        {
          type: Sequelize.TEXT,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.addIndex('Files', ['dirMultihash'], { transaction })

      // For reference, this is what the values of the columns should be
      // inherited from sourceFile & storagePath
      // This bulk update is run separaely.

      // await queryInterface.sequelize.query(`
      //   UPDATE "Files" SET
      //   "fileName" = regexp_replace("sourceFile", '(.*)\/','','g'),
      //   "dirMultihash" = CASE
      //     WHEN "type" = 'image' THEN regexp_replace("storagePath", '^\/.*/(Qm.*)\/(Qm.*)$','\\1','g')
      //     ELSE null
      //   END
      // `, { transaction })

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeColumn(
        'Files',
        'fileName',
        { transaction }
      )
      await queryInterface.removeColumn(
        'Files',
        'dirMultihash',
        { transaction }
      )

      await queryInterface.removeIndex('Files', ['dirMultihash'], { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
