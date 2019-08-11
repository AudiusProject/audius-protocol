'use strict'
module.exports = (sequelize, DataTypes) => {
  const AuthMigration = sequelize.define('AuthMigration', {
    handle: {
      type: DataTypes.STRING,
      allowNull: false,
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
  }, {})

  return AuthMigration
}
