const path = require('path')
const fs = require('fs-extra')

const SEGMENT_REGEXP = /(segment[0-9]*.ts)/

// Parse m3u8 file from HLS output and return map(segment filePath (segmentName) => segment duration)
async function getSegmentsDuration(filename, filedir) {
  try {
    const splitResults = filename.split('.')
    const fileRandomName = splitResults[0]
    const manifestPath = path.join(filedir, `${fileRandomName}.m3u8`)
    const manifestContents = await fs.readFile(manifestPath)
    const splitManifest = manifestContents.toString().split('\n')

    const segmentDurations = {}
    for (let i = 0; i < splitManifest.length; i += 1) {
      const matchedResults = splitManifest[i].match(SEGMENT_REGEXP)
      if (matchedResults === null) {
        continue
      }
      const segmentName = matchedResults[0]
      const durationString = splitManifest[i - 1]
      const durationSplit = durationString.split(':')
      const duration = parseFloat(durationSplit[1])
      segmentDurations[segmentName] = duration
    }
    return segmentDurations
  } catch (e) {
    throw new Error(`Failed - ${e}`)
  }
}

module.exports = { getSegmentsDuration }
