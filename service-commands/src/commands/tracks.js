const fs = require('fs')
const assert = require('assert')

const uploadTrack = async (libs, trackMetadata, trackPath) => {
  const trackFile = fs.createReadStream(trackPath)

  const trackId = await libs.uploadTrack({
    trackFile,
    trackMetadata
  })

  // Check that uploaded track is what we expect
  const uploadedTrackMetadata = await libs.getTrack(trackId)

  const errors = []
  for (const [key, value] of Object.entries(trackMetadata)) {
    try {
      assert.deepEqual(uploadedTrackMetadata[key], value)
    } catch (e) {
      errors.push({ key, expected: value, actual: uploadedTrackMetadata[key] })
    }
  }

  if (errors.length > 0) {
    console.log(
      '[uploadTrack] There are discreptancies from what is uploaded and what is returned.'
    )
    console.log(errors)
  }

  return trackId
}

const getTrackMetadata = async (libs, trackId) => {
  return await libs.getTrack(trackId)
}

const addTrackToChain = async (libs, userId, { digest, hashFn, size }) => {
  const trackTxReceipt = await libs.addTrackToChain(userId, {
    digest,
    hashFn,
    size
  })
  return trackTxReceipt
}

const updateTrackOnChain = async (
  libs,
  trackId,
  userId,
  { digest, hashFn, size }
) => {
  const trackTxReceipt = await libs.updateTrackOnChain(trackId, userId, {
    digest,
    hashFn,
    size
  })

  return trackTxReceipt
}

module.exports = {
  uploadTrack,
  getTrackMetadata,
  addTrackToChain,
  updateTrackOnChain
}
