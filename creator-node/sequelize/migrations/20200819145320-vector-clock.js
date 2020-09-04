'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'clock2' column to all 4 data tables - TESTING ONLY
    await queryInterface.addColumn('CNodeUsers', 'clock2', {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false
    })
    await queryInterface.addColumn('AudiusUsers', 'clock2', {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false
    })
    await queryInterface.addColumn('Tracks', 'clock2', {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false
    })
    await queryInterface.addColumn('Files', 'clock2', {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false
    })


    // Add 'clock' column to all 4 data tables
    await queryInterface.addColumn('CNodeUsers', 'clock', {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false
    })
    await queryInterface.addColumn('AudiusUsers', 'clock', {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false
    })
    await queryInterface.addColumn('Tracks', 'clock', {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false
    })
    await queryInterface.addColumn('Files', 'clock', {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false
    })

    // Add composite uniqueness constraint on (cnodeUserUUID, clock) in each table
    await queryInterface.addConstraint(
      'CNodeUsers',
      {
        type: 'UNIQUE',
        fields: ['cnodeUserUUID', 'clock'],
        name: 'CNodeUsers_unique_constraint_(cnodeUserUUID,clock)'
      }
    )
    await queryInterface.addConstraint(
      'AudiusUsers',
      {
        type: 'UNIQUE',
        fields: ['cnodeUserUUID', 'clock'],
        name: 'AudiusUsers_unique_constraint_(cnodeUserUUID,clock)'
      }
    )
    await queryInterface.addConstraint(
      'Tracks',
      {
        type: 'UNIQUE',
        fields: ['cnodeUserUUID', 'clock'],
        name: 'Tracks_unique_constraint_(cnodeUserUUID,clock)'
      }
    )
    // await queryInterface.addConstraint(
    //   'Files',
    //   {
    //     type: 'UNIQUE',
    //     fields: ['cnodeUserUUID', 'clock'],
    //     name: 'Files_unique_constraint_(cnodeUserUUID,clock)'
    //   }
    // )
  },

  down: async (queryInterface, Sequelize) => {
    // Remove uniqueness constraints on (cnodeUserUUID, clock) on all 4 tables
    await queryInterface.removeConstraint(
      'CNodeUsers',
      'CNodeUsers_unique_constraint_(cnodeUserUUID,clock)'
    )
    await queryInterface.removeConstraint(
      'AudiusUsers',
      'AudiusUsers_unique_constraint_(cnodeUserUUID,clock)'
    )
    await queryInterface.removeConstraint(
      'Tracks',
      'Tracks_unique_constraint_(cnodeUserUUID,clock)'
    )

    // Remove clock columns on all 4 tables
    await queryInterface.removeColumn('CNodeUsers', 'clock')
    await queryInterface.removeColumn('AudiusUsers', 'clock')
    await queryInterface.removeColumn('Tracks', 'clock')
    await queryInterface.removeColumn('Files', 'clock')
  }
}
