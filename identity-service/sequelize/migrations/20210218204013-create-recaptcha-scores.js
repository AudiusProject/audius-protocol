'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('RecaptchaScores', {
      id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      walletAddress: {
        allowNull: false,
        type: Sequelize.STRING
      },
      score: {
        allowNull: false,
        type: Sequelize.DECIMAL
      },
      context: {
        allowNull: false,
        type: Sequelize.STRING
      },
      hostname: {
        allowNull: false,
        type: Sequelize.STRING
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
    return queryInterface.dropTable('RecaptchaScores')
  }
}
