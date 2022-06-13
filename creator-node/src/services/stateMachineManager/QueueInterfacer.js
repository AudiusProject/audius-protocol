/**
 * Currently just a singleton wrapper for the updateReplicaSet job processor to be able
 * to access libs/sdk
 */
// TODO: Change this to maybe init a new libs instance inside the updateReplicaSet job processor.
//       Or set it somewhere directly if Bull's separate processing contexts allow for that
class QueueInterfacer {
  init(audiusLibs) {
    this.audiusLibs = audiusLibs
  }

  getAudiusLibs() {
    return this.audiusLibs
  }
}

module.exports = new QueueInterfacer()
