'use strict'
module.exports = (sequelize, DataTypes) => {
  const Waitlist = sequelize.define('Waitlist', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    }
  }, {})

  return Waitlist
}
