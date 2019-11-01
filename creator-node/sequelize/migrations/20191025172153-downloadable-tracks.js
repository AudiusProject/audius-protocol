'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    // add new column "downloadable" enum to Tracks
    // TODO - make enum
    await queryInterface.addColumn('Tracks', 'isDownloadable', {
      type: Sequelize.STRING(16),
      allowNull: false,
      defaultValue: 'no'
    }, { transaction })

    await transaction.commit()
  },
  down: (queryInterface, Sequelize) => {
    // TODO

    return queryInterface.dropTable('User2s')
  }
}
