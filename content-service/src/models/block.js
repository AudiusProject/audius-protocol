'use strict'

module.exports = (sequelize, DataTypes) => {
  const Block = sequelize.define('Block', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    blocknumber: {
      type: DataTypes.BIGINT,
      allowNull: false,
      index: true
    },
    type: {
      type: DataTypes.ENUM('track', 'user'),
      allowNull: false,
      index: true
    }
  }, {})

  Block.associate = function (models) {
  }

  return Block
}
