'use strict';
module.exports = {

  /** TODO - test with pre-existing data */

  up: async (queryInterface, Sequelize) => {
    const resp = await queryInterface.addColumn('CNodeUsers', 'isCreatorNode', {
      type: Sequelize.BOOLEAN,
      unique: false,
      defaultValue: false
    })

    console.log(resp)
    console.log('completed isCNode add')
  },
  down: async (queryInterface, Sequelize) => {
    // return queryInterface.dropTable('Tests');
    await queryInterface.removeColumn('CNodeUsers', 'isCreatorNode')
  }
};