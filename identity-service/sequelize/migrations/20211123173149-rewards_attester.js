'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('RewardAttesterValues', {
      startingBlock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        primaryKey: true
      },
      offset: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    return queryInterface.dropTable('RewardAttesterValues')
  }
}
