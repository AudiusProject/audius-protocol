'use strict'
module.exports = (sequelize, DataTypes) => {
  const SocialHandles = sequelize.define('SocialHandles', {
    handle: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    twitterHandle: {
      allowNull: true,
      type: DataTypes.STRING
    },
    instagramHandle: {
      allowNull: true,
      type: DataTypes.STRING
    },
    tikTokHandle: {
      allowNull: true,
      type: DataTypes.STRING
    },
    pinnedTrackId: {
      allowNull: true,
      type: DataTypes.INTEGER
    },
    website: {
      allowNull: true,
      type: DataTypes.STRING
    },
    donation: {
      allowNull: true,
      type: DataTypes.STRING
    }
  }, {})

  return SocialHandles
}
