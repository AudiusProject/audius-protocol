'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    let multihashChange = queryInterface.changeColumn('Files', 'multihash', {
      allowNull: true,
      type: Sequelize.TEXT,
      index: true
    })
    let blocksTableChange = queryInterface.createTable('Blocks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      blocknumber: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('track', 'user')
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
    return Promise.all([multihashChange, blocksTableChange])
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    let multihashChange = queryInterface.changeColumn('Files', 'multihash', {
      allowNull: false,
      type: Sequelize.TEXT,
      index: true
    })
    let blocksTableChange = queryInterface.dropTable('Blocks')
    return Promise.all([multihashChange, blocksTableChange])
  }
}
