'use strict'

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    multihash: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    trackId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      index: true
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      index: true
    }
  }, {})

  File.associate = function (models) {
  }

  return File
}
