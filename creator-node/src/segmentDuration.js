const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const readFile = promisify(fs.readFile)

const SEGMENT_REGEXP = /(segment[0-9]*.ts)/

// Parse m3u8 file from HLS output and return map(segment filePath (segmentName) => segment duration)
async function getSegmentsDuration (filename, filedir) {
  try {
    let splitResults = filename.split('.')
    let fileRandomName = splitResults[0]
    let manifestPath = path.join(filedir, `${fileRandomName}.m3u8`)
    let manifestContents = await readFile(manifestPath)
    let splitManifest = manifestContents.toString().split('\n')

    let segmentDurations = {}
    for (let i = 0; i < splitManifest.length; i += 1) {
      let matchedResults = splitManifest[i].match(SEGMENT_REGEXP)
      if (matchedResults === null) {
        continue
      }
      let segmentName = matchedResults[0]
      let durationString = splitManifest[i - 1]
      let durationSplit = durationString.split(':')
      let duration = parseFloat(durationSplit[1])
      segmentDurations[segmentName] = duration
    }
    return segmentDurations
  } catch (e) {
    throw new Error(`Failed - ${e}`)
  }
}

module.exports = { getSegmentsDuration }
