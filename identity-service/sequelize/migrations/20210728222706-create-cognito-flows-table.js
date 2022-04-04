'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CognitoFlows', {
      id: {
        allowNull: false,
        type: Sequelize.STRING,
        primaryKey: true
      },
      sessionId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      handle: {
        allowNull: false,
        type: Sequelize.STRING
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING
      },
      score: {
        allowNull: false,
        type: Sequelize.DECIMAL
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

  down: (queryInterface) => {
    return queryInterface.dropTable('CognitoFlows')
  }
}
