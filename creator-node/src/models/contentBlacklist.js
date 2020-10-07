'use strict'

module.exports = (sequelize, DataTypes) => {
  const ContentBlacklist = sequelize.define('ContentBlacklist', {
    id: {
      allowNull: false,
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    type: {
      allowNull: false,
      type: DataTypes.ENUM('USER', 'TRACK'),
      primaryKey: true
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  })

  ContentBlacklist.Types = ['USER', 'TRACK']
  return ContentBlacklist
}
