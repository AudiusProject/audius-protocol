'use strict'
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM({
        values: ['Follow', 'RepostTrack', 'RepostPlaylist', 'RepostAlbum', 'FavoriteTrack']
      }),
      allowNull: false
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    is_hidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    blocknumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    metadata: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      allowNull: false
    }
  }, {})
  return Notification
}
