'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    await queryInterface.sequelize.query(`
      ALTER DATABASE audius_discovery SET DEFAULT_TRANSACTION_ISOLATION TO REPEATABLE READ; 
    `)
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    await queryInterface.sequelize.query(`
      ALTER DATABASE audius_discovery SET DEFAULT_TRANSACTION_ISOLATION TO READ COMMITED; 
    `)
  }
}
