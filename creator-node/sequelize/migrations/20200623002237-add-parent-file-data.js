'use strict';

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
        const fileName = file.sourceFile
          ? file.sourceFile.split('/').slice(-1)[0] || file.sourceFile
          : file.sourceFile

        // Set the dir multihash to the parent CID if there is one
        let dirMultihash
        if (file.type === 'image' && file.storagePath) {
          const storagePathParts = file.storagePath.split('/')
          if (storagePathParts.length === 7) {
            dirMultihash = file.storagePath.split('/').slice(-2)[0]
          }
        }
        // Coerce all falsey types to `null`
        if (!dirMultihash) dirMultihash = null
        
        await queryInterface.sequelize.query(`
          UPDATE "Files"
          SET "fileName" = '${fileName}',
              "dirMultihash" = '${dirMultihash}'
          WHERE "fileUUID" = '${file.fileUUID}'`
        , { transaction })
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
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
};
