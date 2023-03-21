'use strict'

module.exports = (sequelize, DataTypes) => {
  const Fingerprints = sequelize.define(
    'Fingerprints',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        index: true
      },
      visitorId: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
      },
      origin: {
        type: DataTypes.ENUM({
          values: ['web', 'mobile', 'desktop'],
          allowNull: false
        })
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

  return Fingerprints
}
