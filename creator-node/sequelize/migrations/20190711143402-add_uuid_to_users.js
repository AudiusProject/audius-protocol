'use strict'
const uuid = require('uuid/v4')
// const axios = require('axios') // required for commented-out code

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let t = await queryInterface.sequelize.transaction()
    await createColumns(queryInterface, Sequelize, t)
    await insertUUIDs(queryInterface, t)
    await addNotNullConstraints(queryInterface, Sequelize, t)
    await deleteOldColumns(queryInterface, t) // should we save this for later?
    await t.commit()

    await queryInterface.sequelize.query('ALTER TABLE "CNodeUsers" ADD PRIMARY KEY ("cnodeUserUUID")')
    await queryInterface.sequelize.query('ALTER TABLE "Files" ADD PRIMARY KEY ("fileUUID")')
    await queryInterface.sequelize.query('ALTER TABLE "AudiusUsers" ADD PRIMARY KEY ("audiusUserUUID")')
  },

  down: (queryInterface, Sequelize, t) => {
    return revertCreateColumns(queryInterface, Sequelize)
  }
}

/** add "cnodeUserUUID" column to all tables */
async function createColumns (queryInterface, Sequelize, t) {
  // Run this one first
  await queryInterface.addColumn('Users', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    unique: true
  }, { transaction: t })

  await queryInterface.addColumn('Tracks', 'trackUUID', {
    type: Sequelize.UUID,
    unique: true
  }, { transaction: t })

  await queryInterface.addColumn('Files', 'fileUUID', {
    type: Sequelize.UUID,
    unique: true
  }, { transaction: t })

  // Run these after, order doesn't matter

  /**
   * Audius Users
   */
  await queryInterface.addColumn('AudiusUsers', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Users',
      key: 'cnodeUserUUID',
      as: 'cnodeUserUUID'
    }
  }, { transaction: t })

  await queryInterface.addColumn('AudiusUsers', 'coverArtFileUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Files',
      key: 'fileUUID',
      as: 'coverArtFileUUID'
    }
  }, { transaction: t })

  await queryInterface.addColumn('AudiusUsers', 'profilePicFileUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Files',
      key: 'fileUUID',
      as: 'profilePicFileUUID'
    }
  }, { transaction: t })

  await queryInterface.addColumn('AudiusUsers', 'metadataFileUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Files',
      key: 'fileUUID',
      as: 'metadataFileUUID'
    }
  }, { transaction: t })

  await queryInterface.addColumn('AudiusUsers', 'audiusUserUUID', {
    type: Sequelize.UUID,
    unique: true
  }, { transaction: t })

  /**
   * Files
   */

  await queryInterface.addColumn('Files', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Users',
      key: 'cnodeUserUUID',
      as: 'cnodeUserUUID'
    }
  }, { transaction: t })

  await queryInterface.addColumn('Files', 'trackUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Tracks',
      key: 'trackUUID',
      as: 'trackUUID'
    }
  }, { transaction: t })

  await queryInterface.addColumn('Files', 'type', {
    type: Sequelize.STRING(16)
  }, { transaction: t })

  /**
   * Tracks
   */
  await queryInterface.addColumn('Tracks', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Users',
      key: 'cnodeUserUUID',
      as: 'cnodeUserUUID'
    }
  }, { transaction: t })

  await queryInterface.addColumn('Tracks', 'coverArtFileUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Files',
      key: 'fileUUID',
      as: 'coverArtFileUUID'
    }
  }, { transaction: t })

  await queryInterface.addColumn('Tracks', 'metadataFileUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Files',
      key: 'fileUUID',
      as: 'metadataFileUUID'
    }
  }, { transaction: t })

  /**
   * SessionTokens
   */
  await queryInterface.addColumn('SessionTokens', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    onDelete: 'RESTRICT',
    references: {
      model: 'Users',
      key: 'cnodeUserUUID',
      as: 'cnodeUserUUID'
    }
  }, { transaction: t })
}

async function revertCreateColumns (queryInterface, Sequelize) {
  let removeUUIDFromUsers = queryInterface.removeColumn('Users', 'cnodeUserUUID')
  let removeUUIDFromAudiusUsers = queryInterface.removeColumn('AudiusUsers', 'cnodeUserUUID')
  let removeUUIDFromFiles = queryInterface.removeColumn('Files', 'cnodeUserUUID')
  let removeUUIDFromTracks = queryInterface.removeColumn('Tracks', 'cnodeUserUUID')
  let removeUUIDFromSessionTokens = queryInterface.removeColumn('SessionTokens', 'cnodeUserUUID')
  return Promise.all([
    removeUUIDFromUsers,
    removeUUIDFromAudiusUsers,
    removeUUIDFromFiles,
    removeUUIDFromTracks,
    removeUUIDFromSessionTokens
  ])
}

async function insertUUIDs (queryInterface, t) {
  // generate UUID for cnodeUserUUID in Users table
  const users = (await queryInterface.sequelize.query(`SELECT * FROM "Users";`, { transaction: t }))[0]
  for (let user of users) {
    await queryInterface.sequelize.query(`UPDATE "Users" SET "cnodeUserUUID" = '${uuid()}' WHERE "id" = '${user.id}'`, { transaction: t })
  }

  const tracks = (await queryInterface.sequelize.query(`SELECT * FROM "Tracks";`, { transaction: t }))[0]
  for (let track of tracks) {
    await queryInterface.sequelize.query(`UPDATE "Tracks" SET "trackUUID" = '${uuid()}' WHERE "id" = '${track.id}'`, { transaction: t })
  }

  const files = (await queryInterface.sequelize.query(`SELECT * FROM "Files";`, { transaction: t }))[0]
  for (let file of files) {
    await queryInterface.sequelize.query(`UPDATE "Files" SET "fileUUID" = '${uuid()}' WHERE "id" = '${file.id}'`, { transaction: t })
  }

  const audiusUsers = (await queryInterface.sequelize.query(`SELECT * FROM "AudiusUsers";`, { transaction: t }))[0]
  for (let audiusUser of audiusUsers) {
    await queryInterface.sequelize.query(`UPDATE "AudiusUsers" SET "audiusUserUUID" = '${uuid()}' WHERE "id" = '${audiusUser.id}'`, { transaction: t })
  }

  // associate AudiusUsers table with cnodeUserUUID
  await queryInterface.sequelize.query(`
    UPDATE "AudiusUsers"
    SET "cnodeUserUUID" = "Users"."cnodeUserUUID"
    FROM "Users"
    WHERE "Users"."id" = "AudiusUsers"."ownerId"
  `, { transaction: t })

  // associate Files table with cnodeUserUUID
  await queryInterface.sequelize.query(`
    UPDATE "Files"
    SET "cnodeUserUUID" = "Users"."cnodeUserUUID"
    FROM "Users"
    WHERE "Users"."id" = "Files"."ownerId"
  `, { transaction: t })

  await queryInterface.sequelize.query(`
    UPDATE "AudiusUsers"
    SET "metadataFileUUID" = "Files"."fileUUID"
    FROM "Files"
    WHERE "AudiusUsers"."metadataFileId" = "Files"."id"
  `, { transaction: t })

  await queryInterface.sequelize.query(`
    UPDATE "AudiusUsers"
    SET "profilePicFileUUID" = "Files"."fileUUID"
    FROM "Files"
    WHERE "AudiusUsers"."profilePicFileId" = "Files"."id"
  `, { transaction: t })

  await queryInterface.sequelize.query(`
    UPDATE "AudiusUsers"
    SET "coverArtFileUUID" = "Files"."fileUUID"
    FROM "Files"
    WHERE "AudiusUsers"."coverArtFileId" = "Files"."id"
  `, { transaction: t })

  // associate Tracks table with cnodeUserUUID
  await queryInterface.sequelize.query(`
    UPDATE "Tracks"
    SET "cnodeUserUUID" = "Users"."cnodeUserUUID"
    FROM "Users"
    WHERE "Users"."id" = "Tracks"."ownerId"
  `, { transaction: t })

  await queryInterface.sequelize.query(`
    UPDATE "Tracks"
    SET "metadataFileUUID" = "Files"."fileUUID"
    FROM "Files"
    WHERE "Tracks"."metadataFileId" = "Files"."id"
  `, { transaction: t })

  await queryInterface.sequelize.query(`
    UPDATE "Tracks"
    SET "coverArtFileUUID" = "Files"."fileUUID"
    FROM "Files"
    WHERE "Tracks"."coverArtFileId" = "Files"."id"
  `, { transaction: t })

  // associate SessionTokens table with cnodeUserUUID
  await queryInterface.sequelize.query(`
    UPDATE "SessionTokens"
    SET "cnodeUserUUID" = "Users"."cnodeUserUUID"
    FROM "Users"
    WHERE "Users"."id" = "SessionTokens"."userId"
  `, { transaction: t })

  await queryInterface.sequelize.query(`
    WITH "m" as (
      SELECT f."id", t."trackUUID"
      FROM "Files" f
      INNER JOIN "TrackFile" tf ON f."id" = tf."FileId"
      INNER JOIN "Tracks" t ON tf."TrackId" = t."id"
    )

    UPDATE "Files"
    SET "trackUUID" = m."trackUUID"
    FROM "m"
    WHERE "Files"."id" = m."id"
  `, { transaction: t })
}

async function addNotNullConstraints (queryInterface, Sequelize, t) {
  await queryInterface.changeColumn('Users', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true
  }, { transaction: t })

  await queryInterface.changeColumn('Files', 'fileUUID', {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true
  }, { transaction: t })

  // Run these after, order doesn't matter
  await queryInterface.changeColumn('AudiusUsers', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    allowNull: false
  }, { transaction: t })

  await queryInterface.changeColumn('Files', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    allowNull: true
  }, { transaction: t })

  await queryInterface.changeColumn('Tracks', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    allowNull: false
  }, { transaction: t })

  await queryInterface.changeColumn('Tracks', 'trackUUID', {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true
  }, { transaction: t })

  await queryInterface.changeColumn('Tracks', 'blockchainId', {
    type: Sequelize.BIGINT,
    unique: true
  }, { transaction: t })

  await queryInterface.changeColumn('SessionTokens', 'cnodeUserUUID', {
    type: Sequelize.UUID,
    allowNull: false
  }, { transaction: t })
}

async function deleteOldColumns (queryInterface, t) {
  await queryInterface.removeColumn('AudiusUsers', 'ownerId', { transaction: t })
  await queryInterface.removeColumn('AudiusUsers', 'coverArtFileId', { transaction: t })
  await queryInterface.removeColumn('AudiusUsers', 'profilePicFileId', { transaction: t })
  await queryInterface.removeColumn('AudiusUsers', 'metadataFileId', { transaction: t })

  await queryInterface.removeColumn('Files', 'ownerId', { transaction: t })

  await queryInterface.removeColumn('Tracks', 'ownerId', { transaction: t })
  await queryInterface.removeColumn('Tracks', 'metadataFileId', { transaction: t })
  await queryInterface.removeColumn('Tracks', 'coverArtFileId', { transaction: t })

  await queryInterface.removeColumn('SessionTokens', 'userId', { transaction: t })

  await queryInterface.removeColumn('Users', 'id', { transaction: t })
  await queryInterface.removeColumn('AudiusUsers', 'id', { transaction: t })
  await queryInterface.dropTable('TrackFile', { transaction: t })
  await queryInterface.removeColumn('Tracks', 'id', { transaction: t })
  await queryInterface.removeColumn('Files', 'id', { transaction: t })
  await queryInterface.renameTable('Users', 'CNodeUsers', { transaction: t })
}
