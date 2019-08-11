'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('TrackFile', {
      // fields are capitalized since sequelize expects them to be based on the
      //    Track.belongsToMany(File) association
      TrackId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        onDelete: 'RESTRICT',
        references: {
          model: 'Tracks',
          key: 'id',
          as: 'TrackId'
        }
      },
      FileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        onDelete: 'RESTRICT',
        references: {
          model: 'Files',
          key: 'id',
          as: 'FileId'
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
    return queryInterface.dropTable('TrackFile')
  }
}
