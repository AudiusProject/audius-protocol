'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    let userIdChange = queryInterface.addColumn('Files', 'userId', {
      type: Sequelize.BIGINT,
      allowNull: true,
      index: true
    })

    let trackIdChange = queryInterface.changeColumn('Files', 'trackId', {
      allowNull: true,
      type: Sequelize.BIGINT,
      index: true
    })

    return Promise.all([userIdChange, trackIdChange])
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    let undoUserIdChange = queryInterface.removeColumn('Files', 'userId', {
      type: Sequelize.BIGINT,
      allowNull: true,
      index: true
    })

    let undoTrackIdChange = queryInterface.changeColumn('Files', 'trackId', {
      allowNull: false,
      type: Sequelize.BIGINT,
      index: true
    })

    return Promise.all([undoUserIdChange, undoTrackIdChange])
  }
}
