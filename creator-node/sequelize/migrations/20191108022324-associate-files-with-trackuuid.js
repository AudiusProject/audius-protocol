'use strict'
module.exports = {
  /**
   * Fixes bug where track segment files were not associated with trackUUID upon track entry creation.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    const tracks = (await queryInterface.sequelize.query(
      'select "trackUUID", "metadataJSON"->\'track_segments\' as segments from "Tracks" limit 100;',
      { transaction }
    ))[0]

    let updatedTracks = 0
    let skippedTracks = 0

    for (const track of tracks) {
      const cids = track.segments.map(segment => segment.multihash)
      if (cids.length === 0) { console.log(`track uuid ${track.trackUUID} has empty track segments`); continue }

      // Find all segment files for CIDs in track
      const segmentFiles = (await queryInterface.sequelize.query(
        'select * from "Files" where "type" = \'track\' and "multihash" in (:cids);',
        { replacements: { cids }, transaction }
      ))[0]

      // if segmentfiles already are associated with trackUUID, continue
      if (segmentFiles[0].trackUUID === track.trackUUID) { skippedTracks++; continue }

      // Group all segment files by sourceFile. Store as map { sourceFile: { cid: fileUUID } }
      const sourceFileMap = {}
      for (const segmentFile of segmentFiles) {
        if (segmentFile.sourceFile in sourceFileMap) {
          sourceFileMap[segmentFile.sourceFile][segmentFile.multihash] = segmentFile.fileUUID
        } else {
          sourceFileMap[segmentFile.sourceFile] = { [segmentFile.multihash]: segmentFile.fileUUID }
        }
      }

      // Check if segment files for sourceFile map 1-1 with track CIDs.
      let fileUUIDs = []
      for (const [, filesMap] of Object.entries(sourceFileMap)) {
        if (Object.keys(filesMap).length !== cids.length) { fileUUIDs = []; continue }
        for (const cid of cids) {
          if (cid in filesMap) { fileUUIDs.push(filesMap[cid]) }
        }
        if (fileUUIDs.length === cids.length) { break }
      }

      // associate
      await queryInterface.sequelize.query(
        'update "Files" set "trackUUID" = (:trackUUID) where "fileUUID" in (:fileUUIDs);',
        { replacements: { trackUUID: track.trackUUID, fileUUIDs }, transaction }
      )
      updatedTracks++
    }
    await transaction.commit()
    console.log(`updated tracks: ${updatedTracks}. skipped tracks ${skippedTracks}.`)
  },
  down: (queryInterface, Sequelize) => { }
}
