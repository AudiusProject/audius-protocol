'use strict'
module.exports = (sequelize, DataTypes) => {
  const SessionToken = sequelize.define(
    'SessionToken',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      cnodeUserUUID: {
        type: DataTypes.UUID,
        allowNull: false
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
      },
      lastUsed: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {}
  )
  SessionToken.associate = function (models) {
    SessionToken.belongsTo(models.CNodeUser, {
      foreignKey: 'cnodeUserUUID',
      sourceKey: 'cnodeUserUUID',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    })
  }
  return SessionToken
}
