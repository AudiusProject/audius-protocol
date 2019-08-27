'use strict';

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
    return multihashChange
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
    return multihashChange
  }
}
