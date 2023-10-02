'use strict'
module.exports = (sequelize, DataTypes) => {
  const InstagramUser = sequelize.define(
    'InstagramUser',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      profile: {
        type: DataTypes.JSONB,
        allowNull: false,
        unique: false
      },
      accessToken: {
        type: DataTypes.STRING,
        allowNull: false
      },
      verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      uuid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      blockchainUserId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      indexes: [
        {
          fields: [`((profile->>'username'))`],
          unique: false,
          name: 'instagram_users_profile_username_idx'
        }
      ]
    }
  )

  return InstagramUser
}
