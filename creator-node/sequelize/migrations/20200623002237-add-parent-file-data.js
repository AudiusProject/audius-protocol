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

      const files = (await queryInterface.sequelize.query(`SELECT * FROM "Files";`, { transaction }))[0]
      for (let file of files) {
        // Set the filename to the last uri "part" of the source file if present
        // otherwise, use just the sourceFile
        // After this migration, the fileName field should always represent the "stored" file name
        // for *every* file and it can probably replace file.sourceFile entirely.
        const fileName = file.sourceFile
          ? file.sourceFile.split('/').slice(-1)[0] || file.sourceFile
          : file.sourceFile

        // Set the dir multihash to the parent CID if there is one
        let dirMultihash
        if (file.type === 'image' && file.storagePath) {
          const match = file.storagePath.match(/(?<parent>Qm.*)\/(?<child>Qm.*)/)
          if (match) {
            const { groups: { parent } } = match
            if (parent) {
              dirMultihash = parent
            }
          }
        }
        // Coerce all falsey types to `null` (meaning our regex couldn't find a parent multihash)
        if (!dirMultihash) dirMultihash = null

        await queryInterface.sequelize.query(`
          UPDATE "Files"
          SET "fileName" = '${fileName}',
              "dirMultihash" = '${dirMultihash}'
          WHERE "fileUUID" = '${file.fileUUID}'`
        , { transaction })
      }

      await queryInterface.addIndex('Files', ['multihash'], { transaction })
      await queryInterface.addIndex('Files', ['dirMultihash'], { transaction })

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

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
