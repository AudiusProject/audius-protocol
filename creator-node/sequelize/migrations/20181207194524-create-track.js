'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Tracks', {
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
      metadataFileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        onDelete: 'RESTRICT',
        references: {
          model: 'Files',
          key: 'id',
          as: 'metadataFileId'
        }
      },
      metadataJSON: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      blockchainId: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      coverArtFileId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        onDelete: 'RESTRICT',
        references: {
          model: 'Files',
          key: 'id',
          as: 'coverArtFileId'
        }
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
    return queryInterface.dropTable('Tracks')
  }
}
