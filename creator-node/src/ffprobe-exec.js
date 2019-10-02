const path = require('path')
const fs = require('fs')

const SEGMENT_REGEXP = /(segment[0-9]*.ts)/

// Retrieve segment durations for an entire directory in a single child process
// Standard output is parsed and returned as a dictionary of <segmentName, duration>
async function getSegmentsDuration (req, segmentPath, filename, filedir) {
  return new Promise((resolve, reject) => {
    try {
      let splitResults = filename.split('.')
      let fileRandomName = splitResults[0]
      let manifestPath = path.join(filedir, `${fileRandomName}.m3u8`)
      let manifestContents = fs.readFileSync(manifestPath)
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
      resolve(segmentDurations)
    } catch (e) {
      reject(new Error(`Failed - ${e}`))
    }
  })
}

module.exports = { getSegmentsDuration }
