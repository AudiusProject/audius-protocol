'use strict'

module.exports = (sequelize, DataTypes) => {
  const RewardAttesterValues = sequelize.define(
    'RewardAttesterValues',
    {
      startingBlock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        primaryKey: true
      },
      offset: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {}
  )
  return RewardAttesterValues
}
