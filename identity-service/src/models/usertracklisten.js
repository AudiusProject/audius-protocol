'use strict'
module.exports = (sequelize, DataTypes) => {
  const UserTrackListen = sequelize.define(
    'UserTrackListen',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      trackId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    },
    {}
  )
  return UserTrackListen
}
