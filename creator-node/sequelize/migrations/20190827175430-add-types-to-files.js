'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction()

    const userMetadataFileUUIDSet = new Set(
      ((await queryInterface.sequelize.query(`SELECT "metadataFileUUID" FROM "AudiusUsers" WHERE "metadataFileUUID" IS NOT NULL;`, { transaction: t }))[0]).map(obj => obj.metadataFileUUID)
    )
    const userCoverArtFileUUIDSet = new Set(
      ((await queryInterface.sequelize.query(`SELECT "coverArtFileUUID" FROM "AudiusUsers" WHERE "coverArtFileUUID" IS NOT NULL;`, { transaction: t }))[0]).map(obj => obj.coverArtFileUUID)
    )
    const userProfilePicFileUUIDSet = new Set(
      ((await queryInterface.sequelize.query(`SELECT "profilePicFileUUID" FROM "AudiusUsers" WHERE "profilePicFileUUID" IS NOT NULL;`, { transaction: t }))[0]).map(obj => obj.profilePicFileUUID)
    )
    const trackMetadataFileUUIDSet = new Set(
      ((await queryInterface.sequelize.query(`SELECT "metadataFileUUID" FROM "Tracks" WHERE "metadataFileUUID" IS NOT NULL;`, { transaction: t }))[0]).map(obj => obj.metadataFileUUID)
    )
    const trackCoverArtFileUUIDSet = new Set(
      ((await queryInterface.sequelize.query(`SELECT "coverArtFileUUID" FROM "Tracks" WHERE "coverArtFileUUID" IS NOT NULL;`, { transaction: t }))[0]).map(obj => obj.coverArtFileUUID)
    )

    // console.log([...trackMetadataFileUUIDSet].slice(0,10))
    // console.log([...trackMetadataFileUUIDSet].slice(0,10))
    // console.log([...userMetadataFileUUIDSet].slice(0,10))
    // console.log([...userCoverArtFileUUIDSet].slice(0,10))
    // console.log([...userProfilePicFileUUIDSet].slice(0,10))
    // console.log([...trackCoverArtFileUUIDSet].slice(0,10))
    // throw new Error('hi')

    // Populate type for all files
    const files = (await queryInterface.sequelize.query(`SELECT * FROM "Files";`, { transaction: t }))[0]
    let orphanedFiles = [] // no types
    let corruptedFiles = [] // multiple types
    let trackFiles = []
    let metadataFiles = []
    let imageFiles = []

    for (let file of files) {
      let type = null
      const fileUUID = file.fileUUID

      // Determine type of file
      if (file.sourceFile) {
        type = 'track'
        trackFiles.push(file)
      }
      if (userMetadataFileUUIDSet.has(fileUUID) || trackMetadataFileUUIDSet.has(fileUUID)) {
        if (type != null) {
          corruptedFiles.push(file)
        }
        type = 'metadata'
        metadataFiles.push(file)
      }
      if (userCoverArtFileUUIDSet.has(fileUUID) || userProfilePicFileUUIDSet.has(fileUUID) || trackCoverArtFileUUIDSet.has(fileUUID)) {
        if (type != null) {
          corruptedFiles.push(file)
        }
        type = 'image'
        imageFiles.push(file)
      }
      if (type == null) {
        orphanedFiles.push(file)
      }
      // Write file type to DB
      await queryInterface.sequelize.query(
        `UPDATE "Files" SET "type" = '${type}' WHERE "fileUUID" = '${fileUUID}'`,
        { transaction: t }
      )
    }
    console.log('num orphaned files', orphanedFiles.length)
    console.log('num corrupted files', corruptedFiles.length)
    console.log(`num track files ${trackFiles.length}`)
    console.log(`num metadata files ${metadataFiles.length}`)
    console.log(`num image files ${imageFiles.length}`)

    await t.commit()
    // throw new Error('hehe')
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Files', 'type')
  }
}
