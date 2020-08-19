'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
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

    // Add 'isCurrent' column to tables - TBD
    // await queryInterface.addColumn('AudiusUsers', 'isCurrent', {
    //   type: Sequelize.BOOLEAN,
    //   unique: false,
    //   allowNull: false
    // })
    // await queryInterface.addColumn('Tracks', 'isCurrent', {
    //   type: Sequelize.BOOLEAN,
    //   unique: false,
    //   allowNull: false
    // })
    // await queryInterface.addColumn('Files', 'isCurrent', {
    //   type: Sequelize.BOOLEAN,
    //   unique: false,
    //   allowNull: false
    // })

    // TBD - Add constraint on (cnodeUserUUID, isCurrent) in each table to ensure only 1 row marked isCurrent = true
    // await queryInterface.addConstraint(
    //   'AudiusUsers',
    //   {
    //     type: 'UNIQUE',
    //     fields: ['cnodeUserUUID', 'isCurrent'],
    //     where: { isCurrent: true },
    //     name: 'AudiusUsers_unique_constraint_(cnodeUserUUID,isCurrent)'
    //   }
    // )
    // await queryInterface.addConstraint(
    //   'Tracks',
    //   {
    //     type: 'UNIQUE',
    //     fields: ['cnodeUserUUID', 'isCurrent'],
    //     where: { isCurrent: true },
    //     name: 'AudiusUsers_unique_constraint_(cnodeUserUUID,isCurrent)'
    //   }
    // )
    // await queryInterface.addConstraint(
    //   'AudiusUsers',
    //   {
    //     type: 'UNIQUE',
    //     fields: ['cnodeUserUUID', 'isCurrent'],
    //     where: { isCurrent: true },
    //     name: 'AudiusUsers_unique_constraint_(cnodeUserUUID,isCurrent)'
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
