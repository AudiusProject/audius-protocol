'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    let addAuthMigrationsTablePromise = queryInterface.createTable('AuthMigrations', {
      handle: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
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
    let addParanoidAuthFieldPromise = queryInterface.addColumn('Authentications', 'deletedAt', { type: Sequelize.DATE, allowNull: true })

    return Promise.all([addAuthMigrationsTablePromise, addParanoidAuthFieldPromise])
  },
  down: (queryInterface, Sequelize) => {
    let addAuthMigrationsTablePromise = queryInterface.dropTable('AuthMigrations')
    let addParanoidAuthFieldPromise = queryInterface.removeColumn('Authentications', 'deletedAt')

    return Promise.all([addAuthMigrationsTablePromise, addParanoidAuthFieldPromise])
  }
}
