'use strict';
module.exports = {

  /** TODO - test with pre-existing data */

  up: async (queryInterface, Sequelize) => {
    const resp = await queryInterface.addColumn('CNodeUsers', 'spID', {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: true,
      defaultValue: null
    })

    console.log(resp)
    console.log('completed spID add')
  },
  down: async (queryInterface, Sequelize) => {
    // return queryInterface.dropTable('Tests');
    await queryInterface.removeColumn('CNodeUsers', 'spID')
  }
};