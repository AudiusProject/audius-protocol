'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('AuthMigrations')
  },
  down: (queryInterface, Sequelize) => { }
}
