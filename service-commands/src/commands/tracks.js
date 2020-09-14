const fs = require('fs')

const uploadTrack = async (libs, trackMetadata, trackPath) => {
  const trackFile = fs.createReadStream(trackPath)

  const trackId = await libs.uploadTrack({
    trackFile,
    trackMetadata
  })

  return trackId
}

const getTrackMetadata = async (libs, trackId) => {
  return libs.getTrack(trackId)
}

module.exports = { uploadTrack, getTrackMetadata }
