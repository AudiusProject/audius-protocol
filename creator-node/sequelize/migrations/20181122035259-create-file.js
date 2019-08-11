'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Files', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        onDelete: 'RESTRICT',
        references: {
          model: 'Users',
          key: 'id',
          as: 'ownerId'
        }
      },
      multihash: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sourceFile: {
        type: Sequelize.TEXT,
        allowNull: true // `true` as we use File entries for more than just uploaded tracks
      },
      storagePath: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Files')
  }
}
