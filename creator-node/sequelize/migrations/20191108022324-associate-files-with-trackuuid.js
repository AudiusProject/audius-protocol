'use strict'
module.exports = {
  /**
   * Fixes bug where track segment files were not associated with trackUUID upon track entry creation.
   */
  up: async (queryInterface, Sequelize) => {
    const start = Date.now()
    // Set all file trackUUIDs to null before re-assigning.
    await queryInterface.sequelize.query('update "Files" set "trackUUID" = null;')

    const tracks = (await queryInterface.sequelize.query(
      'select "trackUUID", "metadataJSON"->\'track_segments\' as segments, "cnodeUserUUID" from "Tracks";'
    ))[0]

    /** For every track, find all potential un-matched files, check for matches and associate. */
    for (const track of tracks) {
      const cids = track.segments.map(segment => segment.multihash)
      if (cids.length === 0) {
        console.log(`trackUUID ${track.trackUUID} has track segments length 0.`)
        continue
      }

      const cnodeUserUUID = track.cnodeUserUUID

      // Find all segment files for CIDs in track, that don't already have a trackUUID.
      let segmentFiles = (await queryInterface.sequelize.query(
        'select * from "Files" where "type" = \'track\' and "multihash" in (:cids) and "cnodeUserUUID" = (:cnodeUserUUID) and "trackUUID" is null;',
        { replacements: { cids, cnodeUserUUID } }
      ))[0]
      if (segmentFiles.length === 0) {
        console.log(`trackUUID ${track.trackUUID} has segmentFiles length 0.`)
        continue
      }

      // Get all segment files for sourceFiles from above, to account for tracks that are superset of current track.
      const sourceFiles = segmentFiles.map(segmentFile => segmentFile.sourceFile)
      segmentFiles = (await queryInterface.sequelize.query(
        'select * from "Files" where "type" = \'track\' and "sourceFile" in (:sourceFiles) and "cnodeUserUUID" = (:cnodeUserUUID) and "trackUUID" is null;',
        { replacements: { sourceFiles, cnodeUserUUID } }
      ))[0]

      // Group all segment files by sourceFile. Store as map { sourceFile: { cid: fileUUID } }.
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
        fileUUIDs = []
        if (Object.keys(filesMap).length !== cids.length) { continue }
        for (const cid of cids) {
          if (cid in filesMap) {
            fileUUIDs.push(filesMap[cid])
          }
        }
        if (fileUUIDs.length === cids.length) { break }
      }
      if (fileUUIDs.length === 0) {
        console.log(`trackUUID ${track.trackUUID} has 0 matching available fileUUIDs. segmentFiles length ${segmentFiles.length}.`)
        continue
      }

      // associate
      await queryInterface.sequelize.query(
        'update "Files" set "trackUUID" = (:trackUUID) where "fileUUID" in (:fileUUIDs);',
        { replacements: { trackUUID: track.trackUUID, fileUUIDs } }
      )
    }
    console.log(`Finished processing ${tracks.length} tracks in ${Date.now() - start}ms.`)
  },
  down: (queryInterface, Sequelize) => { }
}
