'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Authentications', {
      iv: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cipherText: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lookupKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
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
    return queryInterface.dropTable('Authentications')
  }
}
