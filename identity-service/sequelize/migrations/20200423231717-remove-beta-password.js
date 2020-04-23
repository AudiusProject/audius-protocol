'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('BetaPasswords')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.createTable('BetaPasswords', {
      password: {
        type: Sequelize.STRING,
        primaryKey: true,
        autoIncrement: false,
        allowNull: false
      },
      remainingLogins: {
        type: Sequelize.INTEGER,
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
  }
}
