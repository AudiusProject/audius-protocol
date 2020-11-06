'use strict'

module.exports = (sequelize, DataTypes) => {
  const types = Object.freeze({
    user: 'USER',
    track: 'TRACK',
    cid: 'CID'
  })

  const ContentBlacklist = sequelize.define('ContentBlacklist', {
    id: {
      allowNull: false,
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    type: {
      allowNull: false,
      type: DataTypes.ENUM(types.user, types.track, types.cid)
    },
    value: {
      allowNull: false,
      type: DataTypes.TEXT,
      // Matches positive integers from 0-n, and Qm... of length 46
      validate: {
        is: /^(0|[1-9]\d*)$|(^Qm[a-zA-Z0-9]{44}$)/
      }
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

  ContentBlacklist.Types = types
  return ContentBlacklist
}
